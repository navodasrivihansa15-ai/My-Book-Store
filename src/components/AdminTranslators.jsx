import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { logStaffAction } from '../utils/staffActivityTracker';

export default function AdminTranslators({ currentUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_si: ''
  });

  const fetchTranslators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contributors')
        .select('*')
        .eq('role', 'TRANSLATOR')
        .order('name_en', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching translators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranslators();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name_en: '', name_si: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name_en: item.name_en || '',
      name_si: item.name_si || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name_en.trim() || !formData.name_si.trim()) {
      alert('Please enter both English and Sinhala names.');
      return;
    }

    const payload = {
      name_en: formData.name_en.trim(),
      name_si: formData.name_si.trim(),
      role: 'TRANSLATOR'
    };

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('contributors')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        logStaffAction('INVENTORY_UPDATED', `Updated Translator "${payload.name_en}"`, {}, currentUser);
      } else {
        const { error } = await supabase
          .from('contributors')
          .insert([payload]);
        if (error) throw error;
        logStaffAction('INVENTORY_UPDATED', `Added Translator "${payload.name_en}"`, {}, currentUser);
      }

      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ name_en: '', name_si: '' });
      fetchTranslators();
    } catch (err) {
      console.error('Error saving translator:', err);
      alert('Error saving translator: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record permanently?")) return;
    try {
      const { error } = await supabase
        .from('contributors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems((prev) => prev.filter((item) => item.id !== id));
      logStaffAction('INVENTORY_UPDATED', `Deleted Translator ID ${id}`, {}, currentUser);
    } catch (err) {
      console.error('Error deleting record:', err);
      alert("Error deleting record.");
    }
  };

  const filteredItems = items.filter(
    (item) =>
      (item.name_en || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.name_si || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen text-gray-900">
      {/* HEADER */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900">Translators Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage translator records stored in the `contributors` table (role = 'TRANSLATOR').
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition"
        >
          + Add Translator
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <input
          type="text"
          placeholder="🔍 Search translators by English or Sinhala name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-md px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs font-bold text-gray-500">
          Total Translators: {filteredItems.length}
        </span>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase">
              <th className="p-3.5">English Name</th>
              <th className="p-3.5">Sinhala Name</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50/30">
                <td className="p-3.5 font-bold text-gray-900">{item.name_en}</td>
                <td className="p-3.5 text-gray-700 font-medium">{item.name_si || '-'}</td>
                <td className="p-3.5">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold">
                    {item.role}
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
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filteredItems.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-400">
                  No translators found. Click "+ Add Translator" to add one!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-extrabold text-gray-900">
                {editingItem ? '✏️ Edit Translator' : '🌐 Add New Translator'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">English Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Sinhala Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ජෝන් ඩෝ"
                  value={formData.name_si}
                  onChange={(e) => setFormData({ ...formData, name_si: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-semibold"
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
                  {editingItem ? 'Save Changes' : 'Create Translator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
