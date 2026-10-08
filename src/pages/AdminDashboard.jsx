import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, Check, AlertCircle, UploadCloud, Printer, ChevronLeft, Search, Image as ImageIcon, Edit2, X } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('inventory');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto pt-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 no-print">
        <div>
          <h1 className="text-4xl font-serif text-brand-blue font-bold mb-2">Command Center</h1>
          <p className="text-gray-500 tracking-wide">Manage your bookstore inventory, banners, and orders.</p>
        </div>
        
        <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200 shadow-sm">
          <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'inventory' ? 'bg-theme-deep text-theme-bg shadow' : 'text-theme-medium hover:text-theme-deep'}`}>
            <Plus size={18} /> Inventory
          </button>
          <button onClick={() => setActiveTab('banners')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'banners' ? 'bg-theme-deep text-theme-bg shadow' : 'text-theme-medium hover:text-theme-deep'}`}>
            <ImageIcon size={18} /> Banners
          </button>
          <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'orders' ? 'bg-theme-deep text-theme-bg shadow' : 'text-theme-medium hover:text-theme-deep'}`}>
            <Package size={18} /> Orders
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'inventory' && <motion.div key="inventory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="no-print"><InventoryManagement /></motion.div>}
        {activeTab === 'banners' && <motion.div key="banners" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="no-print"><BannerManagement /></motion.div>}
        {activeTab === 'orders' && <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><OrderManagement /></motion.div>}
      </AnimatePresence>

      <style>{`
        @media print {
          body { background: white; color: black; }
          .no-print { display: none !important; }
          .print-container { width: 100%; border: none; box-shadow: none; background: white; color: black; }
        }
      `}</style>
    </motion.div>
  );
}

// ==========================================
// INVENTORY MANAGEMENT (Add, Search, Edit)
// ==========================================
function InventoryManagement() {
  const [books, setBooks] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [translators, setTranslators] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddPublisherModalOpen, setIsAddPublisherModalOpen] = useState(false);
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false);
  const [isTranslatorModalOpen, setIsTranslatorModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [publisherFormData, setPublisherFormData] = useState({ name: '' });
  const [publisherFile, setPublisherFile] = useState(null);
  const [authorFormData, setAuthorFormData] = useState({ name_en: '', name_si: '' });
  const [translatorFormData, setTranslatorFormData] = useState({ name_en: '', name_si: '' });
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ 
    title: '', author: '', price: '', description: '', stock: '', categories: [], is_featured: false, is_offer: false, is_special: false,
    translator: '', publisher: '', weight: '', discount_percentage: '', sale_price: '' 
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const fetchBooks = async () => {
    const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    if (data) setBooks(data);
  };

  const fetchPublishers = async () => {
    const { data } = await supabase.from('publishers').select('*').order('name');
    if (data) setPublishers(data);
  };

  useEffect(() => { 
    fetchBooks(); 
    fetchPublishers(); 
    
    const fetchDropdownData = async () => {
      const { data: authorsData, error: aError } = await supabase.from('authors').select('*');
      const { data: translatorsData, error: tError } = await supabase.from('translators').select('*');
      const { data: catData, error: cError } = await supabase.from('categories').select('*').order('name');
      
      if (!aError && authorsData) setAuthors(authorsData);
      else if (aError) console.error("Error fetching authors:", aError);
      
      if (!tError && translatorsData) setTranslators(translatorsData);
      else if (tError) console.error("Error fetching translators:", tError);

      if (!cError && catData) setCategories(catData);
      else if (cError) console.error("Error fetching categories:", cError);
    };

    fetchDropdownData();
  }, []);

  const handleChange = (e, isEdit = false) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    
    let newData = isEdit ? { ...editingBook } : { ...formData };
    newData[name] = finalValue;

    // Auto-calculate sale_price
    if (name === 'price' || name === 'discount_percentage') {
      const p = parseFloat(newData.price || 0);
      const d = parseFloat(newData.discount_percentage || 0);
      if (p > 0 && d >= 0) {
        newData.sale_price = (p - (p * (d / 100))).toFixed(2);
      } else if (d === 0 || !newData.discount_percentage) {
        newData.sale_price = p > 0 ? p.toFixed(2) : '';
      }
    }
    
    if (isEdit) setEditingBook(newData);
    else setFormData(newData);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 5000);
  };

  const handleUploadImage = async (uploadFile, bucket) => {
    const fileExt = uploadFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(fileName, uploadFile);
    if (uploadError) throw new Error('Upload failed: ' + uploadError.message);
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);
    return urlData.publicUrl;
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!categoryFormData.name) throw new Error('Category name is required.');
      const { error } = await supabase.from('categories').insert([{ name: categoryFormData.name }]);
      if (error) throw new Error(error.message);
      showNotification('success', 'Category added successfully.');
      setIsCategoryModalOpen(false);
      setCategoryFormData({ name: '' });
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) setCategories(data);
    } catch (err) {
      showNotification('error', err.message);
    } finally { setLoading(false); }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let cover_image_url = null;
      if (file) cover_image_url = await handleUploadImage(file, 'book-covers');

      const { error } = await supabase.from('books').insert({
        title: formData.title, author: formData.author || null, price: parseFloat(formData.price),
        description: formData.description || null, stock: parseInt(formData.stock) || 0,
        categories: formData.categories, is_featured: formData.is_featured, is_offer: formData.is_offer, is_special: formData.is_special, sales_count: 0,
        translator: formData.translator || null, publisher: formData.publisher || null, weight: formData.weight || null,
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : 0,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : parseFloat(formData.price),
        cover_image_url
      });

      if (error) throw new Error(error.message);
      showNotification('success', 'Book added successfully.');
      setFormData({ title: '', author: '', price: '', description: '', stock: '', categories: [], is_featured: false, is_offer: false, is_special: false, translator: '', publisher: '', weight: '', discount_percentage: '', sale_price: '' });
      setFile(null); setPreview(null); fetchBooks();
    } catch (err) {
      showNotification('error', err.message);
    } finally { setLoading(false); }
  };

  const handleAddPublisher = async (e) => {
    e.preventDefault();
    if (!publisherFormData.name || !publisherFile) {
      showNotification('error', 'Publisher Name and Logo are required.');
      return;
    }
    setLoading(true);
    try {
      const logo_url = await handleUploadImage(publisherFile, 'publisher-logos');
      const { data, error } = await supabase.from('publishers').insert({
        name: publisherFormData.name,
        logo_url
      }).select().single();

      if (error) throw new Error(error.message);
      
      showNotification('success', 'Publisher added successfully.');
      setPublishers([...publishers, data]);
      setFormData(prev => ({ ...prev, publisher: data.name }));
      setIsAddPublisherModalOpen(false);
      setPublisherFormData({ name: '' });
      setPublisherFile(null);
    } catch (err) {
      showNotification('error', err.message);
    } finally { setLoading(false); }
  };

  const handleAddAuthor = async (e) => {
    e.preventDefault();
    if (!authorFormData.name_en || !authorFormData.name_si) {
      showNotification('error', 'Both English and Sinhala names are required.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('authors').insert({
        name_en: authorFormData.name_en,
        name_si: authorFormData.name_si
      }).select().single();

      if (error) throw new Error(error.message);
      
      showNotification('success', 'Author added successfully.');
      setAuthors([...authors, data]);
      setFormData(prev => ({ ...prev, author: data.name_en }));
      setIsAuthorModalOpen(false);
      setAuthorFormData({ name_en: '', name_si: '' });
    } catch (err) {
      showNotification('error', err.message);
    } finally { setLoading(false); }
  };

  const handleAddTranslator = async (e) => {
    e.preventDefault();
    if (!translatorFormData.name_en || !translatorFormData.name_si) {
      showNotification('error', 'Both English and Sinhala names are required.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('translators').insert({
        name_en: translatorFormData.name_en,
        name_si: translatorFormData.name_si
      }).select().single();

      if (error) throw new Error(error.message);
      
      showNotification('success', 'Translator added successfully.');
      setTranslators([...translators, data]);
      setFormData(prev => ({ ...prev, translator: data.name_en }));
      setIsTranslatorModalOpen(false);
      setTranslatorFormData({ name_en: '', name_si: '' });
    } catch (err) {
      showNotification('error', err.message);
    } finally { setLoading(false); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let cover_image_url = editingBook.cover_image_url;
      if (file) cover_image_url = await handleUploadImage(file, 'book-covers');

      const { error } = await supabase.from('books').update({
        title: editingBook.title, author: editingBook.author || null, price: parseFloat(editingBook.price),
        description: editingBook.description || null, stock: parseInt(editingBook.stock) || 0,
        categories: editingBook.categories || [], is_featured: editingBook.is_featured, is_offer: editingBook.is_offer, is_special: editingBook.is_special,
        translator: editingBook.translator || null, publisher: editingBook.publisher || null, weight: editingBook.weight || null,
        discount_percentage: editingBook.discount_percentage ? parseFloat(editingBook.discount_percentage) : 0,
        sale_price: editingBook.sale_price ? parseFloat(editingBook.sale_price) : parseFloat(editingBook.price),
        cover_image_url
      }).eq('id', editingBook.id);

      if (error) throw new Error(error.message);
      showNotification('success', 'Book updated successfully.');
      setIsEditModalOpen(false); setFile(null); setPreview(null); fetchBooks();
    } catch (err) {
      showNotification('error', err.message);
    } finally { setLoading(false); }
  };

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8">
      {notification.message && (
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* ADD BOOK SECTION */}
      <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-brand-blue mb-6">Add New Book</h2>
        <form onSubmit={handleAddBook} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Book Title" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
              
              <div className="flex gap-2">
                <select name="author" value={formData.author || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50">
                  <option value="">Select Author (Optional)</option>
                  {authors.map(a => <option key={a.id} value={a.name_en}>{a.name_en} - {a.name_si}</option>)}
                </select>
                <button type="button" onClick={() => setIsAuthorModalOpen(true)} className="bg-theme-deep text-theme-bg px-4 py-2.5 rounded hover:bg-theme-darkest transition-colors shadow font-bold text-sm whitespace-nowrap cursor-pointer">
                  + Add
                </button>
              </div>

              <div className="flex gap-2">
                <select name="translator" value={formData.translator || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50">
                  <option value="">Select Translator (Optional)</option>
                  {translators.map(t => <option key={t.id} value={t.name_en}>{t.name_en} - {t.name_si}</option>)}
                </select>
                <button type="button" onClick={() => setIsTranslatorModalOpen(true)} className="bg-theme-deep text-theme-bg px-4 py-2.5 rounded hover:bg-theme-darkest transition-colors shadow font-bold text-sm whitespace-nowrap cursor-pointer">
                  + Add
                </button>
              </div>

              <div className="flex gap-2">
                <select name="publisher" value={formData.publisher || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50">
                  <option value="">Select Publisher (Optional)</option>
                  {publishers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
                <button type="button" onClick={() => setIsAddPublisherModalOpen(true)} className="bg-theme-deep text-theme-bg px-4 py-2.5 rounded hover:bg-theme-darkest transition-colors shadow font-bold text-sm whitespace-nowrap cursor-pointer">
                  + Add
                </button>
              </div>
              <input type="text" name="weight" value={formData.weight || ''} onChange={handleChange} placeholder="Weight (e.g. 250g)" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
              <input type="number" name="stock" value={formData.stock || ''} onChange={handleChange} placeholder="Stock Qty" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
              <input required type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} placeholder="Orig. Price (LKR)" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
              <input type="number" step="0.1" name="discount_percentage" value={formData.discount_percentage || ''} onChange={handleChange} placeholder="Discount (%)" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
              <input type="number" step="0.01" name="sale_price" value={formData.sale_price || ''} onChange={handleChange} placeholder="Sale Price (LKR)" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50 font-bold text-blue-600" />
              
              <div className="col-span-1 lg:col-span-2">
                <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2">Categories</label>
                <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-300 rounded max-h-32 overflow-y-auto">
                  {categories.map(c => (
                    <label key={c.id} className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs cursor-pointer hover:bg-slate-50 shadow-sm transition-colors">
                      <input type="checkbox" checked={formData.categories.includes(c.name)} onChange={(e) => {
                        if(e.target.checked) setFormData({...formData, categories: [...formData.categories, c.name]});
                        else setFormData({...formData, categories: formData.categories.filter(name => name !== c.name)});
                      }} className="accent-theme-medium cursor-pointer" />
                      {c.name}
                    </label>
                  ))}
                  <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="text-xs text-theme-deep font-bold border border-dashed border-theme-medium/50 bg-theme-light/10 rounded-md px-3 py-1.5 hover:bg-theme-light/30 cursor-pointer transition-colors">+ Add Category</button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 mt-2 mb-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleChange} className="w-4 h-4 accent-brand-gold cursor-pointer" id="feat-check" />
                  <label htmlFor="feat-check" className="text-sm font-semibold text-gray-700 cursor-pointer">Is Featured</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="is_offer" checked={formData.is_offer} onChange={handleChange} className="w-4 h-4 accent-brand-gold cursor-pointer" id="offer-check" />
                  <label htmlFor="offer-check" className="text-sm font-semibold text-gray-700 cursor-pointer">Is Offer</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="is_special" checked={formData.is_special} onChange={handleChange} className="w-4 h-4 accent-brand-gold cursor-pointer" id="special-check" />
                  <label htmlFor="special-check" className="text-sm font-semibold text-gray-700 cursor-pointer">Is Special</label>
                </div>
            </div>
            <textarea name="description" rows="3" value={formData.description || ''} onChange={handleChange} placeholder="Description (Optional)..." className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50 resize-none"></textarea>
          </div>
          <div className="space-y-4 flex flex-col items-center">
            <div className="relative group aspect-[2/3] w-32 md:w-40 border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer overflow-hidden shadow-md">
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f){ setFile(f); setPreview(URL.createObjectURL(f));} }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
              {preview ? <img src={preview} alt="Preview" className="w-full h-full object-cover" /> : <div className="text-center text-slate-400 font-semibold text-xs"><UploadCloud className="mx-auto mb-1" /> Upload Cover</div>}
            </div>
            <button type="submit" disabled={loading} className="w-full bg-theme-deep text-theme-bg font-bold tracking-widest uppercase py-3 rounded hover:bg-theme-darkest transition-all cursor-pointer shadow">
              {loading ? 'Saving...' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>

      {/* INVENTORY LIST & SEARCH */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-brand-blue">Inventory</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-50 border border-slate-300 focus:bg-white rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-brand-gold w-64" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
              <tr><th className="px-6 py-3">Title</th><th className="px-6 py-3">Price</th><th className="px-6 py-3">Stock</th><th className="px-6 py-3 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBooks.map(book => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-semibold text-brand-blue">{book.title}</td>
                  <td className="px-6 py-3">LKR {book.price.toFixed(2)}</td>
                  <td className="px-6 py-3">{book.stock}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => { setEditingBook(book); setIsEditModalOpen(true); setFile(null); setPreview(book.cover_image_url); }} className="text-brand-gold hover:text-brand-blue font-bold uppercase text-xs tracking-wider flex items-center justify-end gap-1 ml-auto cursor-pointer">
                      <Edit2 size={14} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 pb-10 overflow-y-auto bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-3xl bg-slate-50 rounded-2xl p-6 shadow-2xl">
              <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 cursor-pointer z-10"><X size={24} /></button>
              <h2 className="text-2xl font-bold text-brand-blue mb-6">Edit Book</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <input required type="text" name="title" value={editingBook.title} onChange={(e) => handleChange(e, true)} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
                  
                  <select name="author" value={editingBook.author || ''} onChange={(e) => handleChange(e, true)} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50">
                    <option value="">Select Author (Optional)</option>
                    {authors.map(a => <option key={a.id} value={a.name_en}>{a.name_en} - {a.name_si}</option>)}
                  </select>
                  <select name="translator" value={editingBook.translator || ''} onChange={(e) => handleChange(e, true)} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50">
                    <option value="">Select Translator (Optional)</option>
                    {translators.map(t => <option key={t.id} value={t.name_en}>{t.name_en} - {t.name_si}</option>)}
                  </select>
                  
                  <select name="publisher" value={editingBook.publisher || ''} onChange={(e) => handleChange(e, true)} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50">
                    <option value="">Select Publisher (Optional)</option>
                    {publishers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                  <input type="text" name="weight" value={editingBook.weight || ''} onChange={(e) => handleChange(e, true)} placeholder="Weight" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
                  <input type="number" name="stock" value={editingBook.stock || ''} onChange={(e) => handleChange(e, true)} placeholder="Stock Qty" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
                  <input required type="number" step="0.01" name="price" value={editingBook.price} onChange={(e) => handleChange(e, true)} placeholder="Orig Price" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
                  <input type="number" step="0.1" name="discount_percentage" value={editingBook.discount_percentage || ''} onChange={(e) => handleChange(e, true)} placeholder="Discount %" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
                  <input type="number" step="0.01" name="sale_price" value={editingBook.sale_price || ''} onChange={(e) => handleChange(e, true)} placeholder="Sale Price" className="col-span-1 md:col-span-2 w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50 font-bold text-blue-600" />
                  
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2">Categories</label>
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-300 rounded max-h-32 overflow-y-auto">
                      {categories.map(c => (
                        <label key={c.id} className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs cursor-pointer hover:bg-slate-50 shadow-sm transition-colors">
                          <input type="checkbox" checked={editingBook.categories?.includes(c.name)} onChange={(e) => {
                            const currentCats = editingBook.categories || [];
                            if(e.target.checked) handleChange({ target: { name: 'categories', value: [...currentCats, c.name], type: 'text' }}, true);
                            else handleChange({ target: { name: 'categories', value: currentCats.filter(name => name !== c.name), type: 'text' }}, true);
                          }} className="accent-theme-medium cursor-pointer" />
                          {c.name}
                        </label>
                      ))}
                      <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="text-xs text-theme-deep font-bold border border-dashed border-theme-medium/50 bg-theme-light/10 rounded-md px-3 py-1.5 hover:bg-theme-light/30 cursor-pointer transition-colors">+ Add Category</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 mt-2 mb-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" name="is_featured" checked={editingBook.is_featured} onChange={(e) => handleChange(e, true)} className="w-4 h-4 accent-brand-gold cursor-pointer" id="edit-feat-check" />
                      <label htmlFor="edit-feat-check" className="text-sm font-semibold text-gray-700 cursor-pointer">Is Featured</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" name="is_offer" checked={editingBook.is_offer} onChange={(e) => handleChange(e, true)} className="w-4 h-4 accent-brand-gold cursor-pointer" id="edit-offer-check" />
                      <label htmlFor="edit-offer-check" className="text-sm font-semibold text-gray-700 cursor-pointer">Is Offer</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" name="is_special" checked={editingBook.is_special} onChange={(e) => handleChange(e, true)} className="w-4 h-4 accent-brand-gold cursor-pointer" id="edit-special-check" />
                      <label htmlFor="edit-special-check" className="text-sm font-semibold text-gray-700 cursor-pointer">Is Special</label>
                    </div>
                  </div>
                </div>
                <textarea name="description" rows="3" value={editingBook.description || ''} onChange={(e) => handleChange(e, true)} placeholder="Description (Optional)..." className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50"></textarea>
                <div className="flex gap-4 items-center">
                   <div className="relative group aspect-[2/3] w-24 border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer overflow-hidden shadow-sm">
                     <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f){ setFile(f); setPreview(URL.createObjectURL(f));} }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                     {preview && <img src={preview} className="w-full h-full object-cover" />}
                   </div>
                   <button type="submit" disabled={loading} className="flex-grow bg-theme-deep text-theme-bg font-bold py-3 rounded hover:bg-theme-darkest transition-colors shadow cursor-pointer">
                     {loading ? 'Saving...' : 'Save Changes'}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CATEGORY MODAL */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-50/90 backdrop-blur-xl border border-slate-200 p-8 rounded-2xl shadow-[0_8px_32px_rgba(26,61,99,0.3)] w-full max-w-md relative">
              <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-4 right-4 text-theme-medium hover:text-theme-darkest cursor-pointer"><X size={24} /></button>
              <h2 className="text-2xl font-bold text-theme-deep mb-6">Add New Category</h2>
              <form onSubmit={handleAddCategory} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2">Category Name</label>
                  <input required type="text" value={categoryFormData.name} onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" placeholder="e.g. Science Fiction" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-theme-deep/85 backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(26,61,99,0.3)] hover:bg-theme-darkest transition-all duration-300 text-theme-bg font-bold tracking-widest uppercase py-3 rounded-full cursor-pointer">
                  {loading ? 'Saving...' : 'Add Category'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD PUBLISHER MODAL */}
      <AnimatePresence>
        {isAddPublisherModalOpen && (
          <div className="fixed inset-0 bg-theme-darkest/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative border border-theme-light/30">
              <button onClick={() => setIsAddPublisherModalOpen(false)} className="absolute top-4 right-4 text-theme-medium hover:text-theme-darkest cursor-pointer"><X size={24} /></button>
              <h2 className="text-2xl font-bold text-theme-deep mb-6">Add New Publisher</h2>
              <form onSubmit={handleAddPublisher} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2">Publisher Name</label>
                  <input required type="text" value={publisherFormData.name} onChange={(e) => setPublisherFormData({ ...publisherFormData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" placeholder="e.g. Penguin Books" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2">Publisher Logo</label>
                  <div className="relative w-full h-32 border-2 border-dashed border-theme-medium/50 rounded flex items-center justify-center bg-theme-bg cursor-pointer overflow-hidden">
                    <input type="file" required accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f){ setPublisherFile(f); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                    {publisherFile ? (
                      <img src={URL.createObjectURL(publisherFile)} className="w-full h-full object-contain p-2" alt="Publisher Logo" />
                    ) : (
                      <div className="text-center text-theme-medium font-semibold text-sm">
                        <UploadCloud className="mx-auto mb-1" /> Upload Logo
                      </div>
                    )}
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-theme-deep text-theme-bg font-bold tracking-widest uppercase py-3 rounded hover:bg-theme-darkest transition-all cursor-pointer shadow">
                  {loading ? 'Saving...' : 'Add Publisher'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD AUTHOR MODAL */}
      <AnimatePresence>
        {isAuthorModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-50/90 backdrop-blur-xl border border-slate-200 p-8 rounded-2xl shadow-[0_8px_32px_rgba(26,61,99,0.3)] w-full max-w-md relative border border-theme-light/30">
              <button onClick={() => setIsAuthorModalOpen(false)} className="absolute top-4 right-4 text-theme-medium hover:text-theme-darkest cursor-pointer"><X size={24} /></button>
              <h2 className="text-2xl font-bold text-theme-deep mb-6">Add New Author</h2>
              <form onSubmit={handleAddAuthor} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2">English Name</label>
                  <input required type="text" value={authorFormData.name_en} onChange={(e) => setAuthorFormData({ ...authorFormData, name_en: e.target.value })} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" placeholder="e.g. Martin Wickramasinghe" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2">Sinhala Name</label>
                  <input required type="text" value={authorFormData.name_si} onChange={(e) => setAuthorFormData({ ...authorFormData, name_si: e.target.value })} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" placeholder="e.g. මාර්ටින් වික්‍රමසිංහ" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-theme-deep/85 backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(26,61,99,0.3)] hover:bg-theme-darkest transition-all duration-300 text-theme-bg font-bold tracking-widest uppercase py-3 rounded-full cursor-pointer">
                  {loading ? 'Saving...' : 'Add Author'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD TRANSLATOR MODAL */}
      <AnimatePresence>
        {isTranslatorModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-50/90 backdrop-blur-xl border border-slate-200 p-8 rounded-2xl shadow-[0_8px_32px_rgba(26,61,99,0.3)] w-full max-w-md relative border border-theme-light/30">
              <button onClick={() => setIsTranslatorModalOpen(false)} className="absolute top-4 right-4 text-theme-medium hover:text-theme-darkest cursor-pointer"><X size={24} /></button>
              <h2 className="text-2xl font-bold text-theme-deep mb-6">Add New Translator</h2>
              <form onSubmit={handleAddTranslator} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2">English Name</label>
                  <input required type="text" value={translatorFormData.name_en} onChange={(e) => setTranslatorFormData({ ...translatorFormData, name_en: e.target.value })} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2">Sinhala Name</label>
                  <input required type="text" value={translatorFormData.name_si} onChange={(e) => setTranslatorFormData({ ...translatorFormData, name_si: e.target.value })} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" placeholder="e.g. ජෝන් ඩෝ" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-theme-deep/85 backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(26,61,99,0.3)] hover:bg-theme-darkest transition-all duration-300 text-theme-bg font-bold tracking-widest uppercase py-3 rounded-full cursor-pointer">
                  {loading ? 'Saving...' : 'Add Translator'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// BANNER MANAGEMENT (Add, Toggle)
// ==========================================
function BannerManagement() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [desktopFile, setDesktopFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [desktopPreview, setDesktopPreview] = useState(null);
  const [mobilePreview, setMobilePreview] = useState(null);
  const [formData, setFormData] = useState({ title: '', link_url: '', is_active: true, is_offer: false });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  const fetchBanners = async () => {
    try {
      const { data } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
      if (data) setBanners(data);
    } catch (e) { console.log('Banners table missing.'); }
  };

  useEffect(() => {
    fetchBanners();
    const channel = supabase.channel('admin:banners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, fetchBanners)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const handleUploadImage = async (uploadFile, bucket) => {
    const fileExt = uploadFile.name.split('.').pop();
    const fileName = `banner-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(fileName, uploadFile);
    if (uploadError) throw new Error(uploadError.message);
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);
    return urlData.publicUrl;
  };

  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!desktopFile || !mobileFile) return alert('Both Desktop and Mobile banner images are required.');
    setLoading(true);
    try {
      const desktop_image_url = await handleUploadImage(desktopFile, 'hero-banners');
      const mobile_image_url = await handleUploadImage(mobileFile, 'hero-banners');
      
      await supabase.from('banners').insert({
        title: formData.title,
        link_url: formData.link_url || null,
        is_active: formData.is_active,
        is_offer: formData.is_offer,
        desktop_image_url,
        mobile_image_url
      });
      
      setFormData({ title: '', link_url: '', is_active: true, is_offer: false });
      setDesktopFile(null); setMobileFile(null); setDesktopPreview(null); setMobilePreview(null);
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let desktop_image_url = editingBanner.desktop_image_url;
      let mobile_image_url = editingBanner.mobile_image_url;

      if (desktopFile) desktop_image_url = await handleUploadImage(desktopFile, 'hero-banners');
      if (mobileFile) mobile_image_url = await handleUploadImage(mobileFile, 'hero-banners');

      await supabase.from('banners').update({
        title: editingBanner.title,
        link_url: editingBanner.link_url || null,
        is_active: editingBanner.is_active,
        is_offer: editingBanner.is_offer,
        desktop_image_url,
        mobile_image_url
      }).eq('id', editingBanner.id);

      setIsEditModalOpen(false); setDesktopFile(null); setMobileFile(null); setDesktopPreview(null); setMobilePreview(null);
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  const toggleStatus = async (id, currentStatus) => {
    await supabase.from('banners').update({ is_active: !currentStatus }).eq('id', id);
  };

  const deleteBanner = async (id) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      await supabase.from('banners').delete().eq('id', id);
    }
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setDesktopPreview(banner.desktop_image_url);
    setMobilePreview(banner.mobile_image_url);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-brand-blue mb-6">Upload New Ad Campaign</h2>
        <form onSubmit={handleAddBanner} className="flex flex-col lg:flex-row gap-8">
          <div className="flex-grow space-y-4 lg:w-1/2">
            <input required type="text" placeholder="Banner Title / Headline" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
            <input type="text" placeholder="Redirect Link (e.g., /book/123)" value={formData.link_url} onChange={e => setFormData({...formData, link_url: e.target.value})} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-300 p-3 rounded flex-1">
                  <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 accent-brand-gold cursor-pointer" />
                  <span className="text-sm font-semibold text-gray-700">Set Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-300 p-3 rounded flex-1">
                  <input type="checkbox" checked={formData.is_offer} onChange={e => setFormData({...formData, is_offer: e.target.checked})} className="w-4 h-4 accent-brand-gold cursor-pointer" />
                  <span className="text-sm font-semibold text-gray-700">Is Offer</span>
              </label>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-brand-gold text-white font-bold uppercase py-3 rounded hover:bg-brand-blue transition-colors shadow cursor-pointer mt-4">
              {loading ? 'Uploading Campaign...' : 'Publish Campaign'}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 lg:w-1/2">
            <div className="w-full sm:w-1/2 flex flex-col gap-2">
              <span className="text-xs font-bold uppercase text-gray-500">Desktop Banner (16:9)</span>
              <div className="relative w-full aspect-video border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 cursor-pointer overflow-hidden">
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f){ setDesktopFile(f); setDesktopPreview(URL.createObjectURL(f));} }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                {desktopPreview ? <img src={desktopPreview} className="w-full h-full object-cover" /> : <span className="text-xs font-semibold text-gray-400">Desktop Image</span>}
              </div>
            </div>
            <div className="w-full sm:w-1/2 flex flex-col gap-2">
              <span className="text-xs font-bold uppercase text-gray-500">Mobile Banner (4:5)</span>
              <div className="relative w-full aspect-[4/5] border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 cursor-pointer overflow-hidden max-h-40">
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f){ setMobileFile(f); setMobilePreview(URL.createObjectURL(f));} }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                {mobilePreview ? <img src={mobilePreview} className="w-full h-full object-cover" /> : <span className="text-xs font-semibold text-gray-400">Mobile Image</span>}
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map(banner => (
          <div key={banner.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="relative h-32 w-full bg-gray-100 flex">
              <div className="w-2/3 h-full"><img src={banner.desktop_image_url || banner.image_url} className="w-full h-full object-cover" /></div>
              <div className="w-1/3 h-full border-l border-white"><img src={banner.mobile_image_url || banner.image_url} className="w-full h-full object-cover" /></div>
            </div>
            <div className="p-4 flex flex-col flex-grow">
              <p className="font-bold text-sm text-brand-blue line-clamp-1 mb-4">{banner.title}</p>
              <div className="mt-auto flex justify-between items-center">
                <button onClick={() => toggleStatus(banner.id, banner.is_active)} className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${banner.is_active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-gray-200 text-gray-600 hover:bg-green-100 hover:text-green-700'}`}>
                  {banner.is_active ? 'Active' : 'Hidden'}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(banner)} className="text-brand-blue hover:text-brand-gold text-xs font-bold uppercase tracking-wider cursor-pointer">Edit</button>
                  <button onClick={() => deleteBanner(banner.id)} className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider cursor-pointer">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-brand-blue/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl relative">
              <button onClick={() => { setIsEditModalOpen(false); setDesktopFile(null); setMobileFile(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 cursor-pointer"><X size={24} /></button>
              <h2 className="text-2xl font-bold text-brand-blue mb-6">Edit Ad Campaign</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <input required type="text" value={editingBanner.title} onChange={e => setEditingBanner({...editingBanner, title: e.target.value})} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
                <input type="text" placeholder="Link URL" value={editingBanner.link_url || ''} onChange={e => setEditingBanner({...editingBanner, link_url: e.target.value})} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
                <div className="flex gap-4 p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editingBanner.is_active} onChange={e => setEditingBanner({...editingBanner, is_active: e.target.checked})} className="w-4 h-4 accent-brand-gold cursor-pointer" />
                      <span className="text-sm font-semibold text-gray-700">Set Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editingBanner.is_offer} onChange={e => setEditingBanner({...editingBanner, is_offer: e.target.checked})} className="w-4 h-4 accent-brand-gold cursor-pointer" />
                      <span className="text-sm font-semibold text-gray-700">Is Offer</span>
                  </label>
                </div>

                <div className="flex gap-4">
                  <div className="relative w-1/2 aspect-video border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 cursor-pointer overflow-hidden">
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f){ setDesktopFile(f); setDesktopPreview(URL.createObjectURL(f));} }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                    {desktopPreview && <img src={desktopPreview} className="w-full h-full object-cover" />}
                  </div>
                  <div className="relative w-1/2 aspect-square border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 cursor-pointer overflow-hidden">
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f){ setMobileFile(f); setMobilePreview(URL.createObjectURL(f));} }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                    {mobilePreview && <img src={mobilePreview} className="w-full h-full object-cover" />}
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-theme-deep text-theme-bg font-bold py-3 rounded hover:bg-theme-darkest transition-colors shadow cursor-pointer mt-4">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// ORDER MANAGEMENT (Verify Slips, Print Bill)
// ==========================================
function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*, order_items (quantity, price, books (title))').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };
  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id, field, value) => {
    const { error } = await supabase.from('orders').update({ [field]: value }).eq('id', id);
    if (!error) { fetchOrders(); if (selectedOrder) setSelectedOrder({ ...selectedOrder, [field]: value }); }
  };

  if (selectedOrder) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm p-8 print-container">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200 no-print">
          <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 text-theme-medium hover:text-theme-deep font-bold uppercase text-xs tracking-wider cursor-pointer">
            <ChevronLeft size={16} /> Back to Orders
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-brand-gold text-white px-4 py-2 rounded font-bold uppercase text-xs tracking-wider hover:bg-brand-blue transition-colors cursor-pointer shadow-sm">
            <Printer size={16} /> Print Invoice
          </button>
        </div>
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-combina text-brand-blue font-bold uppercase tracking-widest">ALEXANDRIA BOOKS</h2>
          <p className="text-gray-500 uppercase tracking-widest text-xs font-semibold mt-1">Official Invoice</p>
        </div>
        <div className="flex justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Order Details</p>
            <p className="font-bold text-gray-800 text-lg">ID: #{selectedOrder.id.slice(0, 8)}</p>
            <p className="text-gray-500">{new Date(selectedOrder.created_at).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Shipping Address</p>
            <p className="text-gray-800 font-medium whitespace-pre-line leading-relaxed max-w-xs">{selectedOrder.shipping_address}</p>
          </div>
        </div>
        <table className="w-full text-left mb-8">
          <thead className="border-b border-gray-300 text-gray-500 uppercase text-xs">
            <tr><th className="py-3">Item</th><th className="py-3 text-center">Qty</th><th className="py-3 text-right">Unit Price</th><th className="py-3 text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {selectedOrder.order_items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 font-medium">{item.books?.title}</td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right text-gray-500">${item.price.toFixed(2)}</td>
                <td className="py-3 text-right font-bold">${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end border-t border-gray-300 pt-6 mb-12">
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-brand-blue">${selectedOrder.total_amount.toFixed(2)}</p>
          </div>
        </div>

        <div className="no-print bg-gray-50 border border-gray-200 p-6 rounded-xl">
          <h3 className="text-lg font-bold text-brand-blue mb-4 border-b border-gray-200 pb-2">Payment Verification</h3>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div><p className="text-gray-500 uppercase tracking-wider text-xs font-bold mb-1">Method</p><p className="font-bold">{selectedOrder.payment_method}</p></div>
            <div><p className="text-gray-500 uppercase tracking-wider text-xs font-bold mb-1">Status</p><span className="font-bold text-brand-gold">{selectedOrder.payment_status}</span></div>
          </div>
          {selectedOrder.payment_slip_url && (
            <div className="mb-6">
              <p className="text-gray-500 uppercase tracking-wider text-xs font-bold mb-2">Proof of Payment</p>
              <a href={selectedOrder.payment_slip_url} target="_blank" rel="noopener noreferrer"><img src={selectedOrder.payment_slip_url} className="w-64 border rounded shadow-sm" /></a>
            </div>
          )}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {selectedOrder.payment_status !== 'Verified' && <button onClick={() => updateStatus(selectedOrder.id, 'payment_status', 'Verified')} className="bg-brand-blue text-white px-5 py-2 rounded font-bold uppercase text-xs tracking-wider hover:bg-brand-blue-light cursor-pointer shadow">Verify Payment</button>}
            {selectedOrder.order_status !== 'Shipped' && <button onClick={() => updateStatus(selectedOrder.id, 'order_status', 'Shipped')} className="bg-green-600 text-white px-5 py-2 rounded font-bold uppercase text-xs tracking-wider hover:bg-green-700 cursor-pointer shadow">Mark as Shipped</button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm overflow-hidden">
       <div className="p-6 border-b border-gray-200 bg-gray-50"><h2 className="text-xl font-bold text-brand-blue">Order History</h2></div>
       <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
            <tr><th className="px-6 py-3">Order ID</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Total</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-gray-500">#{order.id.slice(0,8)}</td>
                <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-bold text-brand-blue">${order.total_amount?.toFixed(2)}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${order.order_status === 'Shipped' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{order.order_status}</span></td>
                <td className="px-6 py-4 text-right"><button onClick={() => setSelectedOrder(order)} className="text-brand-gold hover:text-brand-blue font-bold uppercase text-xs tracking-wider cursor-pointer">Review</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
