import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Adjust path if needed
import { logStaffAction } from '../utils/staffActivityTracker'; // Adjust path if needed

const COLLECTABLE_CATEGORIES = [
  'Bookmarks',
  'Mugs & Drinkware',
  'Reading Lights',
  'Book Sleeves & Totes',
  'Stationery & Journals',
  'Stickers & Pins',
  'Gift Boxes & Merch'
];

export default function AdminCollectables({ currentUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPageVisible, setIsPageVisible] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Bookmarks',
    price: '',
    original_price: '',
    stock: '15',
    barcode: '',
    image_url: '',
    description: ''
  });

  const fetchCollectablesAndSettings = async () => {
    setLoading(true);
    try {
      const [itemsRes, settingRes] = await Promise.all([
        supabase
          .from('collectables')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('store_settings')
          .select('setting_value')
          .eq('setting_key', 'show_collectables_page')
          .maybeSingle()
      ]);

      if (itemsRes.error) throw itemsRes.error;
      setItems(itemsRes.data || []);

      if (settingRes.data) {
        setIsPageVisible(Boolean(settingRes.data.setting_value));
      }
    } catch (err) {
      console.error('Error loading collectables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectablesAndSettings();
  }, []);

  // Show / Hide Collectables Page on Navbar
  const handleToggleVisibility = async () => {
    setToggling(true);
    const nextState = !isPageVisible;
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({
          setting_key: 'show_collectables_page',
          setting_value: nextState,
          updated_at: new Date().toISOString(),
          updated_by: currentUser?.full_name || 'Admin'
        });

      if (error) throw error;
      setIsPageVisible(nextState);

      // Instantly notify Navbar
      window.dispatchEvent(new CustomEvent('collectables-visibility-changed', { detail: nextState }));

      logStaffAction(
        'COLLECTABLES_VISIBILITY',
        `${nextState ? 'SHOWN' : 'HIDDEN'} Collectables Page for Customers`,
        { category: 'ADMIN' },
        currentUser
      );
    } catch (err) {
      alert('Failed to change visibility: ' + err.message);
    } finally {
      setToggling(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'Bookmarks',
      price: '',
      original_price: '',
      stock: '15',
      barcode: `COL-${Math.floor(100000 + Math.random() * 900000)}`,
      image_url: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || '',
      category: item.category || 'Bookmarks',
      price: item.price ?? '',
      original_price: item.original_price ?? '',
      stock: item.stock ?? 0,
      barcode: item.barcode || '',
      image_url: item.image_url || '',
      description: item.description || ''
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setUploadingImage(true);

      // 1. Create a unique file name to avoid overwriting
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // 2. Upload to the 'collectables' Supabase bucket
      const { error: uploadError } = await supabase.storage
        .from('collectables')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 3. Get the Public URL
      const { data: publicUrlData } = supabase.storage
        .from('collectables')
        .getPublicUrl(filePath);

      if (publicUrlData && publicUrlData.publicUrl) {
        // Update the form data with the new live URL
        setFormData((prev) => ({ ...prev, image_url: publicUrlData.publicUrl }));
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading image. Make sure the "collectables" bucket exists and is Public. Error: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveCollectable = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.price) {
      alert('Please enter the Collectable Name and Price.');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      price: Number(formData.price),
      original_price: formData.original_price ? Number(formData.original_price) : null,
      stock: Number(formData.stock || 0),
      barcode: formData.barcode.trim(),
      image_url: formData.image_url.trim(),
      description: formData.description.trim(),
      is_active: true
    };

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('collectables')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;

        logStaffAction('BOOK_UPDATED', `Updated Collectable "${payload.title}"`, { bookId: editingItem.id }, currentUser);
      } else {
        const { error } = await supabase
          .from('collectables')
          .insert([payload]);
        if (error) throw error;

        logStaffAction('BOOK_CREATED', `Added Collectable "${payload.title}" (Rs. ${payload.price})`, {}, currentUser);
      }

      setIsModalOpen(false);
      fetchCollectablesAndSettings();
    } catch (err) {
      console.error('Save collectable error:', err);
      alert('Error saving collectable: ' + err.message);
    }
  };

  const handleDeleteCollectable = async (item) => {
    if (!window.confirm(`🗑️ Permanently delete "${item.title}" from Collectables?`)) return;
    try {
      const { error } = await supabase.from('collectables').delete().eq('id', item.id);
      if (error) throw error;
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      logStaffAction('BOOK_DELETED', `Deleted Collectable "${item.title}"`, { bookId: item.id }, currentUser);
    } catch (err) {
      alert('Failed to delete collectable.');
    }
  };

  const filteredItems = items.filter(
    (item) =>
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.barcode || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen text-gray-900">
      {/* HEADER & SHOW/HIDE CONTROLLER */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold ${
              isPageVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isPageVisible ? '🟢 COLLECTABLES PAGE IS VISIBLE TO USERS' : '🔒 COLLECTABLES PAGE IS HIDDEN FROM USERS'}
          </span>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 mt-2">
            Collectables Inventory & Visibility Manager
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Stored in a dedicated `collectables` table. Customers can purchase Books + Collectables in a single bill.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={toggling}
            onClick={handleToggleVisibility}
            className={`px-4 py-3 rounded-xl font-extrabold text-xs shadow-sm transition flex items-center gap-2 ${
              isPageVisible
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isPageVisible ? '🙈 Hide Collectables Page from Users' : '👁️ Show Collectables Page to Users'}
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition"
          >
            + Add Collectable Item
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <input
          type="text"
          placeholder="🔍 Search collectables by name, category, or barcode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-md px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs font-bold text-gray-500">
          Total Collectables: {filteredItems.length}
        </span>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase">
              <th className="p-3.5">Collectable</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Barcode / SKU</th>
              <th className="p-3.5">Price</th>
              <th className="p-3.5">Stock</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50/30">
                <td className="p-3.5 flex items-center gap-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-10 h-12 object-cover rounded-lg border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-12 bg-blue-50 text-blue-600 font-bold flex items-center justify-center rounded-lg text-sm">
                      🎁
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900">{item.title}</p>
                    <p className="text-[10px] text-gray-400 truncate max-w-xs">{item.description}</p>
                  </div>
                </td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold">
                    {item.category}
                  </span>
                </td>
                <td className="p-3.5 font-mono text-[11px] text-gray-600">{item.barcode || '-'}</td>
                <td className="p-3.5">
                  <span className="font-extrabold text-gray-900">Rs. {Number(item.price || 0).toLocaleString()}</span>
                  {item.original_price && Number(item.original_price) > Number(item.price) && (
                    <span className="block text-[10px] text-gray-400 line-through">
                      Rs. {Number(item.original_price).toLocaleString()}
                    </span>
                  )}
                </td>
                <td className="p-3.5">
                  <span className={`font-bold ${Number(item.stock) <= 3 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {item.stock} in stock
                  </span>
                </td>
                <td className="p-3.5 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCollectable(item)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filteredItems.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-400">
                  No collectable items found. Click "+ Add Collectable Item" to add your first item!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-extrabold text-gray-900">
                {editingItem ? '✏️ Edit Collectable' : '🎁 Add New Collectable'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCollectable} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Collectable Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Metal Feather Bookmark / Rechargeable Reading Light"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-semibold bg-white"
                  >
                    {COLLECTABLE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">POS Barcode / SKU</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Selling Price (Rs.) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-bold text-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Original Price</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD & PREVIEW SECTION */}
              <div>
                <label className="block font-bold text-gray-700 mb-2">Product Image *</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  
                  {/* Image Preview */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-white border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center">
                    {formData.image_url ? (
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl opacity-50">📷</span>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                    />
                    {uploadingImage && (
                      <p className="text-[10px] text-blue-600 font-extrabold animate-pulse">
                        ⏳ Uploading to secure storage...
                      </p>
                    )}
                    <input
                      type="text"
                      placeholder="Or paste an image URL directly..."
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe size, material, or special features..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md"
                >
                  {editingItem ? 'Save Changes' : 'Create Collectable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
