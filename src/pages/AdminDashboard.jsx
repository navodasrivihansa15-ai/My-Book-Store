import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, Check, AlertCircle, UploadCloud, Printer, ChevronLeft, Search, Image as ImageIcon, Edit2, X, CreditCard, Trash2, Settings, Truck, Database, Download, Upload, AlertTriangle } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import StoreCopyPrint from '../components/StoreCopyPrint';

export default function AdminDashboard() {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto pt-4 md:pt-8 pb-24 md:pb-8 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 md:mb-8 gap-4 md:gap-6 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-brand-blue font-bold mb-1 md:mb-2 whitespace-nowrap">Command Center</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 tracking-wide">Manage your bookstore inventory, banners, and orders.</p>
          <div className="mt-4 flex flex-wrap gap-3">
             <Link to="/admin/pos" className="bg-brand-gold text-black px-4 py-2 rounded-lg font-bold text-sm tracking-widest uppercase shadow hover:bg-yellow-500 transition-colors flex items-center gap-2">
               🛒 Launch POS
             </Link>
             {['OWNER', 'ADMIN'].includes(userRole) && (
               <Link to="/admin/users" className="bg-slate-800 text-white border border-slate-700 px-4 py-2 rounded-lg font-bold text-sm tracking-widest uppercase shadow hover:bg-slate-700 transition-colors flex items-center gap-2">
                 🛡️ Manage Users
               </Link>
             )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex overflow-x-auto whitespace-nowrap hide-scrollbar space-x-3 pb-2 md:hidden w-full">
          <button onClick={() => setActiveTab('inventory')} className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'inventory' ? 'bg-theme-deep text-white shadow-md' : 'bg-white border border-gray-200 text-theme-medium'}`}>
            <Plus size={16} /> Inventory
          </button>
          <button onClick={() => setActiveTab('banners')} className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'banners' ? 'bg-theme-deep text-white shadow-md' : 'bg-white border border-gray-200 text-theme-medium'}`}>
            <ImageIcon size={16} /> Banners
          </button>
          <button onClick={() => setActiveTab('orders')} className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'orders' ? 'bg-theme-deep text-white shadow-md' : 'bg-white border border-gray-200 text-theme-medium'}`}>
            <Package size={16} /> Orders
          </button>
          <button onClick={() => setActiveTab('payment')} className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'payment' ? 'bg-theme-deep text-white shadow-md' : 'bg-white border border-gray-200 text-theme-medium'}`}>
            <CreditCard size={16} /> Payment
          </button>
          <button onClick={() => setActiveTab('store')} className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'store' ? 'bg-theme-deep text-white shadow-md' : 'bg-white border border-gray-200 text-theme-medium'}`}>
            <Settings size={16} /> Store
          </button>
          <button onClick={() => setActiveTab('shipping')} className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'shipping' ? 'bg-theme-deep text-white shadow-md' : 'bg-white border border-gray-200 text-theme-medium'}`}>
            <Truck size={16} /> Shipping
          </button>
          {['OWNER', 'ADMIN'].includes(userRole) && (
            <button onClick={() => setActiveTab('database')} className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'database' ? 'bg-theme-deep text-white shadow-md' : 'bg-white border border-gray-200 text-theme-medium'}`}>
              <Database size={16} /> Database
            </button>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex bg-slate-50 p-1 rounded-lg border border-slate-200 shadow-sm">
          <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'inventory' ? 'bg-theme-deep text-theme-bg shadow' : 'text-theme-medium hover:text-theme-deep'}`}>
            <Plus size={18} /> Inventory
          </button>
          <button onClick={() => setActiveTab('banners')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'banners' ? 'bg-theme-deep text-theme-bg shadow' : 'text-theme-medium hover:text-theme-deep'}`}>
            <ImageIcon size={18} /> Banners
          </button>
          <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'orders' ? 'bg-theme-deep text-theme-bg shadow' : 'text-theme-medium hover:text-theme-deep'}`}>
            <Package size={18} /> Orders
          </button>
          <button onClick={() => setActiveTab('payment')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'payment' ? 'bg-theme-deep text-theme-bg shadow' : 'text-theme-medium hover:text-theme-deep'}`}>
            <CreditCard size={18} /> Payment
          </button>
          <button onClick={() => setActiveTab('store')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'store' ? 'bg-theme-deep text-theme-bg shadow' : 'text-theme-medium hover:text-theme-deep'}`}>
            <Settings size={18} /> Store
          </button>
          <button onClick={() => setActiveTab('shipping')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'shipping' ? 'bg-theme-deep text-theme-bg shadow' : 'text-theme-medium hover:text-theme-deep'}`}>
            <Truck size={18} /> Shipping
          </button>
          {['OWNER', 'ADMIN'].includes(userRole) && (
            <button onClick={() => setActiveTab('database')} className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'database' ? 'bg-theme-deep text-theme-bg shadow' : 'text-theme-medium hover:text-theme-deep'}`}>
              <Database size={18} /> Database
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'inventory' && <motion.div key="inventory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="no-print"><InventoryManagement /></motion.div>}
        {activeTab === 'banners' && <motion.div key="banners" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="no-print"><BannerManagement /></motion.div>}
        {activeTab === 'orders' && <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><OrderManagement /></motion.div>}
        {activeTab === 'payment' && <motion.div key="payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="no-print"><AdminPaymentSettings /></motion.div>}
        {activeTab === 'store' && <motion.div key="store" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="no-print"><StoreSettings /></motion.div>}
        {activeTab === 'shipping' && <motion.div key="shipping" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="no-print"><ShippingSettings /></motion.div>}
        {activeTab === 'database' && <motion.div key="database" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="no-print"><DatabaseManagement userRole={userRole} /></motion.div>}
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
  const [contributors, setContributors] = useState([]);
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
    translator: '', publisher: '', weight_g: 250, page_count: '', barcode: '', discount_percentage: '', sale_price: ''
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
      const { data: contData, error: contError } = await supabase.from('contributors').select('*').order('name_en');
      const { data: catData, error: cError } = await supabase.from('categories').select('*').order('name');

      if (!contError && contData) setContributors(contData);
      else if (contError) console.error("Error fetching contributors:", contError);

      if (!cError && catData) setCategories(catData);
      else if (cError) console.error("Error fetching categories:", cError);
    };

    fetchDropdownData();

    // Listen for Broadcast messages from Mobile Scanner
    const scannerChannel = supabase
      .channel('scanner-broadcast-channel')
      .on(
        'broadcast',
        { event: 'scan' },
        (payload) => {
          const scannedBarcode = payload.payload.barcode;
          const target = payload.payload.target;
          
          if (target === 'Inventory' && scannedBarcode) {
            setFormData(prev => ({ ...prev, barcode: scannedBarcode }));
            showNotification('success', `Barcode ${scannedBarcode} loaded from Scanner!`);
          }
        }
      )
      .subscribe((status) => {
         console.log("Inventory Scanner Broadcast Status:", status);
      });

    return () => {
      supabase.removeChannel(scannerChannel);
    };
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
        title: formData.title, author: formData.author || '', price: parseFloat(formData.price),
        description: formData.description || '', stock: parseInt(formData.stock) || 0,
        categories: formData.categories, is_featured: formData.is_featured, is_offer: formData.is_offer, is_special: formData.is_special, sales_count: 0,
        translator: formData.translator || null, publisher: formData.publisher || null, weight_g: parseInt(formData.weight_g) || 250,
        page_count: parseInt(formData.page_count) || null,
        barcode: formData.barcode || null,
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : 0,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : parseFloat(formData.price),
        cover_image_url
      });

      if (error) throw new Error(error.message);
      showNotification('success', 'Book added successfully.');
      setFormData({ title: '', author: '', price: '', description: '', stock: '', categories: [], is_featured: false, is_offer: false, is_special: false, translator: '', publisher: '', weight_g: 250, page_count: '', barcode: '', discount_percentage: '', sale_price: '' });
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

  const handleAddContributor = async (e, role) => {
    e.preventDefault();
    const formData = role === 'AUTHOR' ? authorFormData : translatorFormData;
    if (!formData.name_en || !formData.name_si) {
      showNotification('error', 'Both English and Sinhala names are required.');
      return;
    }
    setLoading(true);
    try {
      // Check if contributor already exists
      const { data: existing } = await supabase.from('contributors').select('*').ilike('name_en', formData.name_en).single();
      
      let finalData;
      if (existing) {
         if (existing.role !== 'BOTH' && existing.role !== role) {
            const { data } = await supabase.from('contributors').update({ role: 'BOTH' }).eq('id', existing.id).select().single();
            finalData = data;
         } else {
            finalData = existing;
         }
      } else {
         const { data, error } = await supabase.from('contributors').insert({
           name_en: formData.name_en,
           name_si: formData.name_si,
           role: role
         }).select().single();
         if (error) throw new Error(error.message);
         finalData = data;
         setContributors([...contributors, finalData]);
      }

      showNotification('success', `${role === 'AUTHOR' ? 'Author' : 'Translator'} added successfully.`);
      if (role === 'AUTHOR') {
        setFormData(prev => ({ ...prev, author: finalData.name_en }));
        setIsAuthorModalOpen(false);
        setAuthorFormData({ name_en: '', name_si: '' });
      } else {
        setFormData(prev => ({ ...prev, translator: finalData.name_en }));
        setIsTranslatorModalOpen(false);
        setTranslatorFormData({ name_en: '', name_si: '' });
      }
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
        title: editingBook.title, author: editingBook.author || '', price: parseFloat(editingBook.price),
        description: editingBook.description || '', stock: parseInt(editingBook.stock) || 0,
        categories: editingBook.categories || [], is_featured: editingBook.is_featured, is_offer: editingBook.is_offer, is_special: editingBook.is_special,
        translator: editingBook.translator || null, publisher: editingBook.publisher || null, weight_g: parseInt(editingBook.weight_g) || 250,
        page_count: parseInt(editingBook.page_count) || null,
        barcode: editingBook.barcode || null,
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Book Title" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-3 md:py-2.5 rounded-lg md:rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
              <input type="text" name="barcode" value={formData.barcode || ''} onChange={handleChange} placeholder="Barcode / ISBN" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-3 md:py-2.5 rounded-lg md:rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />

              <div className="flex gap-2">
                <select name="author" value={formData.author || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50">
                  <option value="">Select Author (Optional)</option>
                  {contributors.map(c => <option key={c.id} value={c.name_en}>{c.name_en} - {c.name_si}</option>)}
                </select>
                <button type="button" onClick={() => setIsAuthorModalOpen(true)} className="bg-theme-deep text-theme-bg px-4 py-2.5 rounded hover:bg-theme-darkest transition-colors shadow font-bold text-sm whitespace-nowrap cursor-pointer">
                  + Add
                </button>
              </div>

              <div className="flex gap-2">
                <select name="translator" value={formData.translator || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50">
                  <option value="">Select Translator (Optional)</option>
                  {contributors.map(c => <option key={c.id} value={c.name_en}>{c.name_en} - {c.name_si}</option>)}
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
              <div className="flex gap-2">
                <input type="number" min="1" step="1" name="weight_g" value={formData.weight_g || ''} onChange={handleChange} placeholder="Weight (g)" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
                <input type="number" min="1" step="1" name="page_count" value={formData.page_count || ''} onChange={handleChange} placeholder="Pages" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
              </div>
              <input type="number" name="stock" value={formData.stock || ''} onChange={handleChange} placeholder="Stock Qty" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
              <input required type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} placeholder="Orig. Price (Rs.)" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
              <input type="number" step="0.1" name="discount_percentage" value={formData.discount_percentage || ''} onChange={handleChange} placeholder="Discount (%)" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
              <input type="number" step="0.01" name="sale_price" value={formData.sale_price || ''} onChange={handleChange} placeholder="Sale Price (Rs.)" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50 font-bold text-blue-600" />

              <div className="col-span-1 lg:col-span-2">
                <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2">Categories</label>
                <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-300 rounded max-h-32 overflow-y-auto">
                  {categories.map(c => (
                    <label key={c.id} className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs cursor-pointer hover:bg-slate-50 shadow-sm transition-colors">
                      <input type="checkbox" checked={formData.categories.includes(c.name)} onChange={(e) => {
                        if (e.target.checked) setFormData({ ...formData, categories: [...formData.categories, c.name] });
                        else setFormData({ ...formData, categories: formData.categories.filter(name => name !== c.name) });
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
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
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
        <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 gap-4 md:gap-0">
          <h2 className="text-xl font-bold text-brand-blue">Inventory</h2>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white border border-slate-300 focus:bg-white rounded-full py-2 md:py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-brand-gold w-full md:w-64 shadow-sm" />
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
              <tr><th className="px-6 py-3">Title</th><th className="px-6 py-3">Price</th><th className="px-6 py-3">Stock</th><th className="px-6 py-3 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBooks.map(book => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-semibold text-brand-blue">{book.title}</td>
                  <td className="px-6 py-3">{formatPrice(book.price)}</td>
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

        {/* MOBILE CARDS */}
        <div className="md:hidden flex flex-col p-4 gap-3 bg-gray-100">
          {filteredBooks.map(book => (
            <div key={book.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
              <div className="font-bold text-brand-blue text-sm">{book.title}</div>
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>Price: <span className="font-bold">{formatPrice(book.price)}</span></span>
                <span>Stock: <span className={`font-bold ${book.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>{book.stock}</span></span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => { setEditingBook(book); setIsEditModalOpen(true); setFile(null); setPreview(book.cover_image_url); }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 text-brand-gold hover:bg-slate-100 rounded-lg font-bold uppercase text-xs tracking-wider"
                >
                  <Edit2 size={14} /> Edit Book
                </button>
              </div>
            </div>
          ))}
          {filteredBooks.length === 0 && (
            <div className="text-center py-8 text-gray-500 font-medium">No books found.</div>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed top-[56px] md:top-[80px] bottom-0 inset-x-0 z-[50] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto mx-auto bg-slate-50 rounded-2xl p-5 md:p-6 shadow-2xl">
              <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 cursor-pointer z-10"><X size={24} /></button>
              <h2 className="text-xl md:text-2xl font-bold text-brand-blue mb-4 md:mb-6">Edit Book</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <input required type="text" name="title" value={editingBook.title} onChange={(e) => handleChange(e, true)} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-3 md:py-2 rounded-lg md:rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
                  <input type="text" name="barcode" value={editingBook.barcode || ''} onChange={(e) => handleChange(e, true)} placeholder="Barcode / ISBN" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-3 md:py-2 rounded-lg md:rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />

                  <select name="author" value={editingBook.author || ''} onChange={(e) => handleChange(e, true)} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50">
                    <option value="">Select Author (Optional)</option>
                    {contributors.map(c => <option key={c.id} value={c.name_en}>{c.name_en} - {c.name_si}</option>)}
                  </select>
                  <select name="translator" value={editingBook.translator || ''} onChange={(e) => handleChange(e, true)} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50">
                    <option value="">Select Translator (Optional)</option>
                    {contributors.map(c => <option key={c.id} value={c.name_en}>{c.name_en} - {c.name_si}</option>)}
                  </select>

                  <select name="publisher" value={editingBook.publisher || ''} onChange={(e) => handleChange(e, true)} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50">
                    <option value="">Select Publisher (Optional)</option>
                    {publishers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input type="number" min="1" step="1" name="weight_g" value={editingBook.weight_g || ''} onChange={(e) => handleChange(e, true)} placeholder="Weight (g)" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
                    <input type="number" min="1" step="1" name="page_count" value={editingBook.page_count || ''} onChange={(e) => handleChange(e, true)} placeholder="Pages" className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
                  </div>
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
                            if (e.target.checked) handleChange({ target: { name: 'categories', value: [...currentCats, c.name], type: 'text' } }, true);
                            else handleChange({ target: { name: 'categories', value: currentCats.filter(name => name !== c.name), type: 'text' } }, true);
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
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
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
          <div className="fixed top-[56px] md:top-[80px] bottom-0 inset-x-0 z-[50] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-50/90 backdrop-blur-xl border border-slate-200 p-4 md:p-6 rounded-2xl shadow-[0_8px_32px_rgba(26,61,99,0.3)] w-[95%] max-w-md mx-auto max-h-[85vh] overflow-y-auto relative">
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
          <div className="fixed top-[56px] md:top-[80px] bottom-0 inset-x-0 bg-theme-darkest/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-4 md:p-6 rounded-xl shadow-2xl w-[95%] max-w-md mx-auto max-h-[85vh] overflow-y-auto relative border border-theme-light/30">
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
                    <input type="file" required accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setPublisherFile(f); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
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
          <div className="fixed top-[56px] md:top-[80px] bottom-0 inset-x-0 z-[50] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-50/90 backdrop-blur-xl border border-slate-200 p-4 md:p-6 rounded-2xl shadow-[0_8px_32px_rgba(26,61,99,0.3)] w-[95%] max-w-md mx-auto max-h-[85vh] overflow-y-auto relative border border-theme-light/30">
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
          <div className="fixed top-[56px] md:top-[80px] bottom-0 inset-x-0 z-[50] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-50/90 backdrop-blur-xl border border-slate-200 p-4 md:p-6 rounded-2xl shadow-[0_8px_32px_rgba(26,61,99,0.3)] w-[95%] max-w-md mx-auto max-h-[85vh] overflow-y-auto relative border border-theme-light/30">
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
            <input required type="text" placeholder="Banner Title / Headline" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
            <input type="text" placeholder="Redirect Link (e.g., /book/123)" value={formData.link_url} onChange={e => setFormData({ ...formData, link_url: e.target.value })} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-300 p-3 rounded flex-1">
                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 accent-brand-gold cursor-pointer" />
                <span className="text-sm font-semibold text-gray-700">Set Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 border border-gray-300 p-3 rounded flex-1">
                <input type="checkbox" checked={formData.is_offer} onChange={e => setFormData({ ...formData, is_offer: e.target.checked })} className="w-4 h-4 accent-brand-gold cursor-pointer" />
                <span className="text-sm font-semibold text-gray-700">Is Offer</span>
              </label>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-yellow-600 text-white font-bold uppercase py-3 rounded hover:bg-blue-900 transition-colors shadow cursor-pointer mt-4">
              {loading ? 'Uploading Campaign...' : 'Publish Campaign'}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 lg:w-1/2">
            <div className="w-full sm:w-1/2 flex flex-col gap-2">
              <span className="text-xs font-bold uppercase text-gray-500">Desktop Banner (16:5)</span>
              <div className="relative w-full aspect-video border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 cursor-pointer overflow-hidden">
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setDesktopFile(f); setDesktopPreview(URL.createObjectURL(f)); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                {desktopPreview ? <img src={desktopPreview} className="w-full h-full object-cover" /> : <span className="text-xs font-semibold text-gray-400">Desktop Image</span>}
              </div>
            </div>
            <div className="w-full sm:w-1/2 flex flex-col gap-2">
              <span className="text-xs font-bold uppercase text-gray-500">Mobile Banner (3:2)</span>
              <div className="relative w-full aspect-[4/5] border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 cursor-pointer overflow-hidden max-h-40">
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setMobileFile(f); setMobilePreview(URL.createObjectURL(f)); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
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
          <div className="fixed inset-0 bg-blue-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-4 md:p-6 rounded-xl shadow-2xl w-[95%] max-w-2xl mx-auto max-h-[85vh] overflow-y-auto relative">
              <button onClick={() => { setIsEditModalOpen(false); setDesktopFile(null); setMobileFile(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 cursor-pointer"><X size={24} /></button>
              <h2 className="text-2xl font-bold text-brand-blue mb-6">Edit Ad Campaign</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <input required type="text" value={editingBanner.title} onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
                <input type="text" placeholder="Link URL" value={editingBanner.link_url || ''} onChange={e => setEditingBanner({ ...editingBanner, link_url: e.target.value })} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors text-theme-darkest placeholder-theme-darkest/50" />
                <div className="flex gap-4 p-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editingBanner.is_active} onChange={e => setEditingBanner({ ...editingBanner, is_active: e.target.checked })} className="w-4 h-4 accent-brand-gold cursor-pointer" />
                    <span className="text-sm font-semibold text-gray-700">Set Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editingBanner.is_offer} onChange={e => setEditingBanner({ ...editingBanner, is_offer: e.target.checked })} className="w-4 h-4 accent-brand-gold cursor-pointer" />
                    <span className="text-sm font-semibold text-gray-700">Is Offer</span>
                  </label>
                </div>

                <div className="flex gap-4">
                  <div className="relative w-1/2 aspect-video border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 cursor-pointer overflow-hidden">
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setDesktopFile(f); setDesktopPreview(URL.createObjectURL(f)); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                    {desktopPreview && <img src={desktopPreview} className="w-full h-full object-cover" />}
                  </div>
                  <div className="relative w-1/2 aspect-square border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 cursor-pointer overflow-hidden">
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setMobileFile(f); setMobilePreview(URL.createObjectURL(f)); } }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
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
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [shippedModalOpen, setShippedModalOpen] = useState(false);
  const [trackingForm, setTrackingForm] = useState({ tracking_service: '', tracking_number: '', tracking_link: '' });
  const [billLogoExt, setBillLogoExt] = useState('png');
  const [waQrExt, setWaQrExt] = useState('png');
  const [imgTimestamp] = useState(Date.now());
  const [storeSettings, setStoreSettings] = useState({ name: 'Alexandria Books', slogan: '', address: '', phone: '', email: '' });
  const navigate = useNavigate();
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [storePrintSize, setStorePrintSize] = useState(null);

  const { user, userFullName } = useAuth();
  let activeStaffName = null;
  try { 
    const stored = JSON.parse(sessionStorage.getItem('active_staff'))?.name;
    if (stored && !stored.includes('@')) {
      activeStaffName = stored;
    }
  } catch(e) {}
  const handlerName = activeStaffName || userFullName || user?.email || user?.user_metadata?.full_name || 'Unknown Staff';

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*, order_items (quantity, price, books (title, price, discount_percentage))').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };
  useEffect(() => {
    fetchOrders();

    const fetchSettings = async () => {
      const { data } = await supabase.from('store_settings').select('*').limit(1).single();
      if (data) setStoreSettings(data);
    };
    fetchSettings();

    const ordersSubscription = supabase.channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders();
        setSelectedOrder(current => {
          if (current && payload.new && current.id === payload.new.id) {
            return { ...current, ...payload.new };
          }
          return current;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, []);

  const updateStatus = async (id, field, value) => {
    let updates = { [field]: value };
    let statToIncrement = null;
    if (field === 'order_status' && value === 'Packed') {
      updates.packed_by = handlerName;
      updates.handled_by = handlerName;
      statToIncrement = 'web_packed';
    }
    const { error } = await supabase.from('orders').update(updates).eq('id', id);
    if (!error) { 
      fetchOrders(); 
      if (selectedOrder) setSelectedOrder({ ...selectedOrder, ...updates }); 
      try {
        const activeStaff = JSON.parse(sessionStorage.getItem('active_staff') || '{}');
        if (activeStaff.session_id) {
          if (statToIncrement) await supabase.rpc('increment_session_stat', { session_id: activeStaff.session_id, stat_column: statToIncrement });
          await supabase.rpc('increment_session_stat', { session_id: activeStaff.session_id, stat_column: 'web_handled' });
        }
      } catch(e) {}
    }
  };

  const handleVerifyPayment = async (id) => {
    const updates = { payment_status: 'Verified', order_status: 'Processing', reject_reason: null, payment_verified_by: handlerName, handled_by: handlerName };
    const { error } = await supabase.from('orders').update(updates).eq('id', id);
    if (!error) { 
      fetchOrders(); 
      if (selectedOrder) setSelectedOrder({ ...selectedOrder, ...updates }); 
      try {
        const activeStaff = JSON.parse(sessionStorage.getItem('active_staff') || '{}');
        if (activeStaff.session_id) {
          await supabase.rpc('increment_session_stat', { session_id: activeStaff.session_id, stat_column: 'payments_verified' });
          await supabase.rpc('increment_session_stat', { session_id: activeStaff.session_id, stat_column: 'web_handled' });
        }
      } catch(e) {}
    }
  };

  if (selectedOrder) {
    const mailingBgUrl = supabase.storage.from('web-assets').getPublicUrl('MCBG.png').data.publicUrl;
    const logoUrl = supabase.storage.from('web-assets').getPublicUrl('Bill Logo.png').data.publicUrl;

    const ITEMS_PER_PAGE = 10;
    const ITEMS_ON_LAST_PAGE = 6;
    const billPages = [];
    let itemsCopy = [...(selectedOrder.order_items || [])];

    while (itemsCopy.length > 0) {
      if (itemsCopy.length <= ITEMS_ON_LAST_PAGE) {
        billPages.push({ items: itemsCopy.splice(0, ITEMS_ON_LAST_PAGE), isLast: true });
      } else if (itemsCopy.length <= ITEMS_PER_PAGE && itemsCopy.length > ITEMS_ON_LAST_PAGE) {
        billPages.push({ items: itemsCopy.splice(0, ITEMS_PER_PAGE), isLast: false });
        if (itemsCopy.length === 0) {
          billPages.push({ items: [], isLast: true });
        }
      } else {
        billPages.push({ items: itemsCopy.splice(0, ITEMS_PER_PAGE), isLast: false });
      }
    }
    if (billPages.length === 0) billPages.push({ items: [], isLast: true });

    const totalBillPages = billPages.length;
    billPages.forEach((page, index) => {
      page.pageIndex = index + 1;
      page.totalPages = totalBillPages;
    });

    const printSections = ['COVER', ...billPages];
    const a4Pages = [];
    for (let i = 0; i < printSections.length; i += 2) {
      a4Pages.push(printSections.slice(i, i + 2));
    }

    const MailingCover = ({ order, storeSettings, mailingBgUrl, billLogoExt, imgTimestamp }) => (
      <div 
        className="a5-landscape-cover flex flex-col justify-between bg-white text-black relative h-full w-full"
        style={{
          backgroundImage: `url(${mailingBgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6 bg-white/80 p-3 rounded-xl">
              <div>
                <h1 className="text-2xl font-bold font-serif uppercase tracking-wider text-black">{storeSettings.name}</h1>
                <p className="text-sm font-semibold">{storeSettings.address}</p>
                <p className="text-sm font-semibold">Tel: {storeSettings.phone} | Email: {storeSettings.email}</p>
              </div>
              <img
                src={`${supabase.storage.from('web-assets').getPublicUrl(`Bill Logo.${billLogoExt}`).data.publicUrl}?t=${imgTimestamp}`}
                alt="Logo" className="h-16 w-auto object-contain grayscale"
              />
            </div>

            <div className="border-4 border-black p-6 rounded-xl mb-6 bg-white/90 backdrop-blur-sm">
              <h2 className="text-xl font-bold uppercase tracking-widest mb-4 border-b-2 border-black pb-2">Deliver To:</h2>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl font-bold mb-2">{order.customer_name || order.user_email}</p>
                  <p className="text-lg leading-relaxed">{order.shipping_address}</p>
                  <p className="text-xl font-bold mt-4">Contact: {order.contact_number}</p>
                </div>
                {order.payment_method?.includes('COD') && (
                  <div className="ml-4 border-2 border-black px-5 py-2.5 rounded-xl shrink-0 self-start bg-white">
                    <p className="text-lg font-extrabold tracking-wide text-black whitespace-nowrap">COD : {Number(order.total_amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}/=</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t-2 border-black pt-4 flex justify-between items-end bg-white/80 p-3 rounded-xl">
            <div>
              <p className="text-xs uppercase font-bold text-gray-500">Order Ref</p>
              <p className="text-xl font-bold">#{order.display_id || order.id.split('-')[0].toUpperCase()}</p>
            </div>
            <div className="border-2 border-black p-2 font-bold text-sm uppercase px-4 text-center bg-white rounded-lg">
              URGENT<br/>
              <span className="text-xs normal-case font-semibold">Handle with care! Books inside. Please transport them safely and treat them with love. 🖤</span>
            </div>
          </div>
        </div>
      </div>
    );

    const RotatedA5Bill = ({ order, pageData, storeSettings, pageIndex, totalPages, logoUrl }) => (
      <div className="a5-portrait-container bg-white text-black h-full w-full">
        <div className="a5-portrait-bill flex flex-col h-full bg-white relative">
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-4 border-b border-black pb-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain grayscale mb-1" />
                  <p className="text-[10px] italic text-gray-700 font-serif text-center max-w-[150px]">"{storeSettings.slogan || 'Tota est scientia'}"</p>
                </div>
                <div>
                  <h2 className="text-xl font-bold uppercase">Official Invoice</h2>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">Order: #{order.display_id || order.id.split('-')[0].toUpperCase()}</p>
                <p className="text-sm">Date: {new Date(order.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <table className="w-full text-left mb-4 text-black border-collapse text-sm">
                <thead className="border-b-2 border-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2">Item</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {pageData.items.map((item, idx) => {
                    const discount = item.books?.discount_percentage || 0;
                    return (
                      <tr key={idx} className="avoid-break">
                        <td className="py-2 font-medium pr-2 text-xs">{item.books?.title} {discount > 0 ? `(-${discount}%)` : ''}</td>
                        <td className="py-2 text-center text-xs">{item.quantity}</td>
                        <td className="py-2 text-right text-xs">{formatPrice(item.price)}</td>
                        <td className="py-2 text-right font-bold text-xs">{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {pageData.isLast && (
                <div className="flex justify-end mt-4">
                  <div className="text-right w-full max-w-sm">
                    <p className="font-bold mb-3 uppercase tracking-widest text-gray-500 text-xs">Payment Status: <span className="text-black">{order.payment_status}</span></p>
                    
                    <div className="flex justify-end gap-6 mb-1 text-sm">
                      <span className="text-gray-600 font-medium">Subtotal:</span>
                      <span className="font-bold">{formatPrice(order.total_amount - (order.shipping_fee || 0))}</span>
                    </div>
                    
                    <div className="flex justify-end gap-6 mb-2 text-sm items-start">
                      <div className="flex flex-col items-end">
                        <span className="text-gray-600 font-medium">Delivery Charges:</span>
                        {order.shipping_breakdown && (
                          <span className="text-[9px] text-gray-600 block leading-tight whitespace-nowrap">({order.shipping_breakdown})</span>
                        )}
                      </div>
                      <span className="font-bold">{formatPrice(order.shipping_fee || 0)}</span>
                    </div>

                    <div className="border-t border-black pt-1 mt-1">
                      <p className="text-xs uppercase font-bold text-gray-500 mb-1">Grand Total</p>
                      <p className="text-2xl font-bold">{formatPrice(order.total_amount)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="mt-auto pt-3 border-t border-gray-300">
            <div className="flex items-center justify-between">
              {/* Left Side: WhatsApp QR & Phone */}
              <div className="flex items-center gap-3">
                <img 
                  src={supabase.storage.from('web-assets').getPublicUrl('WhGrpQR.png').data.publicUrl} 
                  onError={(e) => {
                    const fallbacks = [
                      'WhGrpQR.jpg', 'WhGrpQR.jpeg', 'WhGrpQR.PNG', 'WhGrpQR.JPG',
                      'whgrpqr.png', 'whgrpqr.jpg', 'WHGrpQR.png', 'WHGrpQR.jpg',
                      'WhgrpQR.png', 'WhgrpQR.jpg'
                    ];
                    let idx = Number(e.target.dataset.idx || 0);
                    if (idx < fallbacks.length) {
                      e.target.dataset.idx = idx + 1;
                      e.target.src = supabase.storage.from('web-assets').getPublicUrl(fallbacks[idx]).data.publicUrl;
                    } else {
                      e.target.style.display = 'none';
                    }
                  }}
                  alt="WhatsApp QR" className="w-16 h-16 object-contain" 
                />
                <div>
                  <p className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">WhatsApp Us</p>
                  <p className="text-sm font-bold text-gray-900">{storeSettings?.phone || "07X XXX XXXX"}</p>
                </div>
              </div>

              {/* Right Side: Thank You Message */}
              <div className="text-right max-w-[50%]">
                <p className="text-xs font-semibold text-gray-800">Thank you for your purchase.</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Embark on Another Literary Journey</p>
              </div>
            </div>

            {/* Very Bottom: Website Link */}
            <div className="mt-2 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              {storeSettings?.website || "WWW.YOURSTORE.LK"}
            </div>
            {pageData.totalPages > 1 && (
              <div className="text-center mt-2 text-[10px] font-medium text-gray-500">
                Page {pageData.pageIndex} of {pageData.totalPages}
              </div>
            )}
            <div className="text-[10px] text-gray-500 italic text-center mt-2 border-t border-gray-200 pt-1">
              * Delivery fees are based solely on actual postal or courier charges.
            </div>
          </div>
        </div>
      </div>
    );

    const performPrint = () => {
      const originalTitle = document.title;
      document.title = selectedOrder.display_id || 'Invoice';
      window.print();
      document.title = originalTitle;
    };

    const handlePrint = () => {
      setIsPreparingPrint(true);
      const img = new Image();
      img.src = mailingBgUrl;
      img.onload = () => {
        setIsPreparingPrint(false);
        setTimeout(performPrint, 300);
      };
      img.onerror = () => {
        setIsPreparingPrint(false);
        performPrint();
      };
    };

    const handlePrintStoreCopy = (size) => {
      setStorePrintSize(size);
      setTimeout(() => {
        const originalTitle = document.title;
        document.title = selectedOrder?.display_id || 'Store_Copy';
        window.print();
        document.title = originalTitle;
        setTimeout(() => setStorePrintSize(null), 500); // Clear after print
      }, 300);
    };

    return (
      <div className="bg-white text-black border border-black md:rounded-xl shadow-none p-4 md:p-8">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-black no-print">
          <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 text-black hover:text-gray-600 font-bold uppercase text-xs tracking-wider cursor-pointer">
            <ChevronLeft size={16} /> Back to Orders
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-1">
              <span className="text-xs font-bold uppercase text-gray-500 hidden md:block mr-1">Store Copy:</span>
              <button onClick={() => handlePrintStoreCopy('A4')} className="bg-gray-200 text-black px-3 py-2 rounded-none font-bold text-xs uppercase hover:bg-gray-300 transition-colors border border-gray-400 cursor-pointer">A4</button>
              <button onClick={() => handlePrintStoreCopy('A5')} className="bg-gray-200 text-black px-3 py-2 rounded-none font-bold text-xs uppercase hover:bg-gray-300 transition-colors border border-gray-400 cursor-pointer">A5</button>
            </div>
            <button onClick={handlePrint} disabled={isPreparingPrint} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-none font-bold uppercase text-xs tracking-wider hover:bg-gray-800 transition-colors cursor-pointer border border-black disabled:opacity-50 disabled:cursor-not-allowed">
              <Printer size={16} /> {isPreparingPrint ? "Preparing Print..." : "Print Packing Sheet"}
            </button>
          </div>
        </div>

        {/* SCREEN VIEW (NO PRINT) */}
        <div className="no-print">
          <div className="mb-10 text-center flex flex-col items-center">
            <img
              src={`${supabase.storage.from('web-assets').getPublicUrl(`Bill Logo.${billLogoExt}`).data.publicUrl}?t=${imgTimestamp}`}
              onError={() => {
                if (billLogoExt === 'png') setBillLogoExt('svg');
              }}
              alt="Store Logo"
              className="h-16 w-auto object-contain mb-2 mx-auto grayscale"
            />
            <p className="italic text-sm text-gray-700 font-serif">"{storeSettings.slogan || 'Tota est scientia'}"</p>
            <p className="text-black uppercase tracking-widest text-xs font-bold mt-4">Order Preview</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 text-black border-y-2 border-black py-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-600 font-bold mb-3">Customer Details</p>
              <p className="font-bold text-lg">{selectedOrder.customer_name || selectedOrder.user_email}</p>
              <p className="text-sm mt-1"><span className="font-semibold text-gray-600">Contact:</span> {selectedOrder.contact_number || 'Not Available'}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs uppercase tracking-widest text-gray-600 font-bold mb-3">Order Details</p>
              <p className="font-bold text-sm">Order #{selectedOrder.display_id || selectedOrder.id.split('-')[0].toUpperCase()}</p>
              <p className="text-sm mt-1"><span className="font-semibold text-gray-600">Date:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
              <p className="text-sm mt-2 leading-relaxed whitespace-pre-line md:ml-auto max-w-xs text-left md:text-right">
                <span className="font-semibold text-gray-600 block mb-1">Shipping Address:</span>
                {selectedOrder.shipping_address || 'Store Pickup'}
              </p>
            </div>
          </div>

          <table className="w-full text-left mb-8 text-black border-collapse hidden md:table">
            <thead className="border-b-2 border-black uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3">Book Name</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-right">Price</th>
                <th className="py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {selectedOrder.order_items.map((item, idx) => (
                <tr key={idx} className="text-sm">
                  <td className="py-4 font-medium pr-4">{item.books?.title}</td>
                  <td className="py-4 text-center font-semibold">{item.quantity}</td>
                  <td className="py-4 text-right font-medium">{formatPrice(item.price)}</td>
                  <td className="py-4 text-right font-bold">{formatPrice(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="md:hidden flex flex-col gap-3 mb-8">
            <p className="text-xs uppercase tracking-widest text-gray-600 font-bold mb-1">Items</p>
            {selectedOrder.order_items.map((item, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-col gap-2 text-sm">
                <div className="font-bold">{item.books?.title}</div>
                <div className="flex justify-between items-center text-xs">
                  <span>Qty: <span className="font-bold">{item.quantity}</span></span>
                  <span><span className="font-bold">{formatPrice(item.price * item.quantity)}</span></span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t-2 border-black pt-6 mb-12">
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-gray-600 font-bold mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-black">{formatPrice(selectedOrder.total_amount)}</p>
            </div>
          </div>
        </div>

        {/* PRINT ONLY: A4 DUAL A5 SHEET */}
        {!storePrintSize && (
          <div className="hidden print:block print-only-packing-sheet print-container bg-gray-200">
            {a4Pages.map((pageSections, a4Index) => (
              <div key={a4Index} className="a4-print-page">
                
                {/* TOP HALF OF A4 */}
                <div className="a5-container border-b-2 border-dashed border-gray-400">
                  {pageSections[0] === 'COVER' ? (
                    <MailingCover order={selectedOrder} storeSettings={storeSettings} mailingBgUrl={mailingBgUrl} billLogoExt={billLogoExt} imgTimestamp={imgTimestamp} />
                  ) : (
                    <RotatedA5Bill order={selectedOrder} pageData={pageSections[0]} storeSettings={storeSettings} pageIndex={billPages.indexOf(pageSections[0]) + 1} totalPages={billPages.length} logoUrl={logoUrl} />
                  )}
                </div>

                {/* BOTTOM HALF OF A4 */}
                <div className="a5-container">
                  {pageSections[1] ? (
                    <RotatedA5Bill order={selectedOrder} pageData={pageSections[1]} storeSettings={storeSettings} pageIndex={billPages.indexOf(pageSections[1]) + 1} totalPages={billPages.length} logoUrl={logoUrl} />
                  ) : null}
                </div>

              </div>
            ))}
          </div>
        )}

        {/* PRINT ONLY: STORE COPY */}
        {storePrintSize && (
          <StoreCopyPrint order={selectedOrder} storeSettings={storeSettings} storePrintSize={storePrintSize} />
        )}

        <div className="no-print bg-gray-50 border border-gray-300 p-4 md:p-6 rounded-none text-black">
          <h3 className="text-lg font-bold mb-4 border-b border-gray-300 pb-2">Order Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 text-sm">
            <div><p className="text-gray-600 uppercase tracking-wider text-xs font-bold mb-1">Method</p><p className="font-bold">{selectedOrder.payment_method}</p></div>
            <div>
              <p className="text-gray-600 uppercase tracking-wider text-xs font-bold mb-1">Payment Status</p>
              <p className="font-bold">{selectedOrder.payment_status}</p>
              {selectedOrder.payment_verified_by && <p className="text-[10px] text-gray-500 mt-1">Verified By: {selectedOrder.payment_verified_by}</p>}
            </div>
            <div>
              <p className="text-gray-600 uppercase tracking-wider text-xs font-bold mb-1">Shipping Status</p>
              <p className="font-bold">{selectedOrder.order_status}</p>
              {selectedOrder.packed_by && <p className="text-[10px] text-gray-500 mt-1">Packed By: {selectedOrder.packed_by}</p>}
            </div>
          </div>
          {selectedOrder.payment_slip_url && (
            <div className="mb-6">
              <p className="text-gray-600 uppercase tracking-wider text-xs font-bold mb-2">Proof of Payment</p>
              <a href={selectedOrder.payment_slip_url} target="_blank" rel="noopener noreferrer"><img src={selectedOrder.payment_slip_url} className="w-64 border border-black grayscale" /></a>
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-300">
            {selectedOrder.payment_status !== 'Verified' && (
              <button onClick={() => handleVerifyPayment(selectedOrder.id)} className="bg-green-600 text-white px-5 py-2 rounded-none font-bold uppercase text-xs tracking-wider hover:bg-green-700 cursor-pointer border border-green-600 shadow-sm">Verify Payment</button>
            )}
            {(selectedOrder.payment_status === 'Pending' || selectedOrder.payment_status === 'Pending Verification') && (
              <button onClick={() => setRejectModalOpen(true)} className="bg-red-600 text-white px-5 py-2 rounded-none font-bold uppercase text-xs tracking-wider hover:bg-red-700 cursor-pointer border border-red-600 shadow-sm">Reject Payment</button>
            )}
            {selectedOrder.payment_status === 'Verified' && (
              <button onClick={() => updateStatus(selectedOrder.id, 'payment_status', 'Pending')} className="bg-white text-black px-5 py-2 rounded-none font-bold uppercase text-xs tracking-wider hover:bg-gray-100 cursor-pointer border border-black">Mark as Unpaid (Reverse)</button>
            )}
            {(selectedOrder.order_status === 'Pending' || selectedOrder.order_status === 'Processing') && (
              <button onClick={() => updateStatus(selectedOrder.id, 'order_status', 'Packed')} className="bg-blue-600 text-white px-5 py-2 rounded-none font-bold uppercase text-xs tracking-wider hover:bg-blue-700 cursor-pointer border border-blue-600 shadow-sm">Mark as Packed</button>
            )}
            {selectedOrder.order_status === 'Packed' && (
              <button onClick={() => updateStatus(selectedOrder.id, 'order_status', 'Processing')} className="bg-white text-black px-5 py-2 rounded-none font-bold uppercase text-xs tracking-wider hover:bg-gray-100 cursor-pointer border border-black">Undo Packing</button>
            )}
            {selectedOrder.order_status !== 'Shipped' && (
              <button onClick={() => setShippedModalOpen(true)} className="bg-black text-white px-5 py-2 rounded-none font-bold uppercase text-xs tracking-wider hover:bg-gray-800 cursor-pointer border border-black">Mark as Shipped</button>
            )}
            {selectedOrder.order_status === 'Shipped' && (
              <button onClick={() => updateStatus(selectedOrder.id, 'order_status', 'Packed')} className="bg-white text-black px-5 py-2 rounded-none font-bold uppercase text-xs tracking-wider hover:bg-gray-100 cursor-pointer border border-black">Undo Shipping</button>
            )}
          </div>
        </div>

        {rejectModalOpen && (
          <div className="fixed top-[56px] md:top-[80px] bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md relative">
              <h2 className="text-xl font-bold text-red-600 mb-2">Reject Payment</h2>
              <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejecting the payment. This will be visible to the customer.</p>
              <textarea
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 mb-4 resize-none"
                rows="3"
                placeholder="e.g., Blurry receipt, insufficient amount sent..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              ></textarea>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setRejectModalOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-800 font-bold text-sm uppercase tracking-wider cursor-pointer">Cancel</button>
                <button
                  onClick={async () => {
                    const { error } = await supabase.from('orders').update({ payment_status: 'Rejected', reject_reason: rejectReason }).eq('id', selectedOrder.id);
                    if (!error) {
                      fetchOrders();
                      setSelectedOrder({ ...selectedOrder, payment_status: 'Rejected', reject_reason: rejectReason });
                      setRejectModalOpen(false);
                      setRejectReason('');
                    }
                  }}
                  disabled={!rejectReason.trim()}
                  className="bg-red-600 text-white px-5 py-2 rounded-xl font-bold uppercase text-sm tracking-wider hover:bg-red-700 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {shippedModalOpen && (
          <div className="fixed top-[56px] md:top-[80px] bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md relative">
              <h2 className="text-xl font-bold text-brand-blue mb-2">Order Tracking Details</h2>
              <p className="text-sm text-gray-600 mb-4">Please provide shipping and tracking details for this order.</p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-600 font-bold mb-1">Tracking Service</label>
                  <input type="text" placeholder="e.g., Domex, Prompt Express" value={trackingForm.tracking_service} onChange={e => setTrackingForm({ ...trackingForm, tracking_service: e.target.value })} className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-brand-blue" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-600 font-bold mb-1">Tracking Number</label>
                  <input type="text" placeholder="e.g., 123456789" value={trackingForm.tracking_number} onChange={e => setTrackingForm({ ...trackingForm, tracking_number: e.target.value })} className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-brand-blue" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-600 font-bold mb-1">Tracking Link</label>
                  <input type="url" placeholder="e.g., https://domex.lk/tracking" value={trackingForm.tracking_link} onChange={e => setTrackingForm({ ...trackingForm, tracking_link: e.target.value })} className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-brand-blue" />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setShippedModalOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-800 font-bold text-sm uppercase tracking-wider cursor-pointer">Cancel</button>
                <button
                  onClick={async () => {
                    const updates = { order_status: 'Shipped', ...trackingForm };
                    let skippedPacked = false;
                    if (!selectedOrder.packed_by) {
                      updates.packed_by = handlerName;
                      skippedPacked = true;
                    }
                    const { error } = await supabase.from('orders').update(updates).eq('id', selectedOrder.id);
                    if (!error) {
                      fetchOrders();
                      setSelectedOrder({ ...selectedOrder, ...updates });
                      setShippedModalOpen(false);
                      setTrackingForm({ tracking_service: '', tracking_number: '', tracking_link: '' });
                      
                      try {
                        const activeStaff = JSON.parse(sessionStorage.getItem('active_staff') || '{}');
                        if (activeStaff.session_id) {
                          if (skippedPacked) await supabase.rpc('increment_session_stat', { session_id: activeStaff.session_id, stat_column: 'web_packed' });
                          await supabase.rpc('increment_session_stat', { session_id: activeStaff.session_id, stat_column: 'web_handled' });
                        }
                      } catch(e) {}
                    }
                  }}
                  className="bg-blue-600 text-white px-5 py-2 rounded-xl font-bold uppercase text-sm tracking-wider hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  Confirm & Ship
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50"><h2 className="text-xl font-bold text-brand-blue">Order History</h2></div>

      {/* DESKTOP ORDERS TABLE */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
            <tr><th className="px-6 py-3">Order ID</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Total</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-gray-500">#{order.display_id || order.id.split('-')[0].toUpperCase()}</td>
                <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-bold text-brand-blue">{formatPrice(order.total_amount)}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${order.order_status === 'Shipped' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{order.order_status}</span></td>
                <td className="px-6 py-4 text-right"><button onClick={() => setSelectedOrder(order)} className="text-brand-gold hover:text-brand-blue font-bold uppercase text-xs tracking-wider cursor-pointer">Review</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE ORDERS CARDS */}
      <div className="md:hidden flex flex-col p-4 gap-3 bg-gray-100">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono text-gray-500 font-bold text-xs">#{order.display_id || order.id.split('-')[0].toUpperCase()}</span>
              <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="font-bold text-brand-blue">{formatPrice(order.total_amount)}</span>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${order.order_status === 'Shipped' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                {order.order_status}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedOrder(order)}
                className="w-full flex items-center justify-center py-2 bg-slate-50 text-brand-gold hover:bg-slate-100 rounded-lg font-bold uppercase text-xs tracking-wider"
              >
                Review Order
              </button>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-500 font-medium">No orders found.</div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// PAYMENT SETTINGS
// ==========================================
function AdminPaymentSettings() {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [qrUrl, setQrUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ bank_name: '', account_name: '', account_number: '', branch: '' });
  const [notification, setNotification] = useState({ type: '', message: '' });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({});

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 5000);
  };

  const fetchBankAccounts = async () => {
    const { data } = await supabase.from('bank_accounts').select('*').order('created_at', { ascending: false });
    if (data) setBankAccounts(data);
  };

  const fetchQrCode = async () => {
    const extensions = ['jpg', 'png', 'jpeg', 'svg', 'webp'];
    for (const ext of extensions) {
      const { data } = supabase.storage.from('web-assets').getPublicUrl(`PyQR.${ext}`);
      try {
        const res = await fetch(data.publicUrl, { method: 'HEAD' });
        if (res.ok) {
          setQrUrl(`${data.publicUrl}?t=${Date.now()}`);
          return;
        }
      } catch (err) {
        // ignore and try next
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBankAccounts(), fetchQrCode()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleAddBankAccount = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from('bank_accounts').insert([formData]).select().single();
      if (error) throw new Error(error.message);
      setBankAccounts([data, ...bankAccounts]);
      setFormData({ bank_name: '', account_name: '', account_number: '', branch: '' });
      showNotification('success', 'Bank account added successfully.');
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('bank_accounts').update({
        bank_name: editData.bank_name,
        account_name: editData.account_name,
        account_number: editData.account_number,
        branch: editData.branch
      }).eq('id', editData.id);

      if (error) throw new Error(error.message);

      setBankAccounts(bankAccounts.map(b => b.id === editData.id ? editData : b));
      setIsEditModalOpen(false);
      showNotification('success', 'Bank account updated.');
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) return;
    try {
      const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
      if (error) throw new Error(error.message);
      setBankAccounts(bankAccounts.filter(b => b.id !== id));
      showNotification('success', 'Bank account deleted.');
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Payment Settings...</div>;
  }

  return (
    <div className="space-y-8">
      {notification.message && (
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* QR Code Section */}
      <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-brand-blue mb-4 border-b border-gray-200 pb-2">QR Code Payment Configuration</h2>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-shrink-0 relative overflow-hidden">
            {qrUrl ? (
              <img src={qrUrl} alt="Payment QR Code" className="w-48 h-48 object-contain" />
            ) : (
              <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm text-center p-4 rounded-xl border border-dashed border-gray-300">
                No QR Code found (PyQR.*)
              </div>
            )}
          </div>
          <div className="text-sm text-gray-600 space-y-2 max-w-lg">
            <p className="font-semibold text-gray-800 text-base">Current QR Code File</p>
            <p>This QR code is displayed to customers during checkout if they select QR Payment.</p>
            <div className="bg-blue-50 text-brand-blue p-4 rounded-lg border border-blue-100 text-xs mt-4">
              <strong>To update this QR code:</strong> Go to your Supabase project dashboard, navigate to Storage &gt; <code className="font-mono bg-blue-100 px-1 rounded">web-assets</code>, and upload or replace a file starting with <code className="font-mono bg-blue-100 px-1 rounded">PyQR</code> (e.g. PyQR.png, PyQR.jpg, or PyQR.svg).
            </div>
          </div>
        </div>
      </div>

      {/* Add Bank Account Form */}
      <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-brand-blue mb-6 border-b border-gray-200 pb-2">Add New Bank Account</h2>
        <form onSubmit={handleAddBankAccount} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required type="text" placeholder="Bank Name (e.g. Commercial Bank)" value={formData.bank_name} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} className="w-full bg-white border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors" />
          <input required type="text" placeholder="Account Name (e.g. N. Srivihansa)" value={formData.account_name} onChange={e => setFormData({ ...formData, account_name: e.target.value })} className="w-full bg-white border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors" />
          <input required type="text" placeholder="Account Number" value={formData.account_number} onChange={e => setFormData({ ...formData, account_number: e.target.value })} className="w-full bg-white border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors font-mono" />
          <input required type="text" placeholder="Branch Name" value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })} className="w-full bg-white border border-slate-300 focus:bg-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors" />
          <div className="md:col-span-2 mt-2">
            <button type="submit" disabled={submitting} className="w-full md:w-auto bg-theme-deep text-white px-8 py-3 rounded hover:bg-theme-darkest transition-colors shadow font-bold tracking-widest uppercase text-sm cursor-pointer disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add Bank Account'}
            </button>
          </div>
        </form>
      </div>

      {/* Bank Accounts List */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50"><h2 className="text-xl font-bold text-brand-blue">Configured Bank Accounts</h2></div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
              <tr><th className="px-6 py-3">Bank</th><th className="px-6 py-3">Account Name</th><th className="px-6 py-3">Account No</th><th className="px-6 py-3">Branch</th><th className="px-6 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bankAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-800">{account.bank_name}</td>
                  <td className="px-6 py-4">{account.account_name}</td>
                  <td className="px-6 py-4 font-mono text-gray-600">{account.account_number}</td>
                  <td className="px-6 py-4 text-gray-500">{account.branch}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditData(account); setIsEditModalOpen(true); }} className="text-brand-gold hover:text-brand-blue font-bold uppercase text-[10px] tracking-wider px-2 py-1 rounded border border-gray-200 cursor-pointer">Edit</button>
                      <button onClick={() => handleDelete(account.id)} className="text-red-500 hover:text-red-700 p-1 cursor-pointer"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {bankAccounts.length === 0 && <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No bank accounts configured.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col p-4 gap-3 bg-gray-100">
          {bankAccounts.map((account) => (
            <div key={account.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => { setEditData(account); setIsEditModalOpen(true); }} className="text-yellow-600 hover:text-blue-900 cursor-pointer p-1.5 bg-yellow-600/10 rounded-full"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(account.id)} className="text-red-500 hover:text-red-700 cursor-pointer p-1.5 bg-red-50 rounded-full"><Trash2 size={14} /></button>
              </div>
              <h3 className="font-bold text-gray-800 mb-1 pr-16">{account.bank_name}</h3>
              <p className="text-sm text-gray-600 mb-2">{account.account_name}</p>
              <div className="bg-gray-50 p-2 rounded text-xs font-mono text-gray-700 flex justify-between border border-gray-100">
                <span>Acc No:</span> <span className="font-bold text-brand-blue">{account.account_number}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 font-medium">Branch: {account.branch}</p>
            </div>
          ))}
          {bankAccounts.length === 0 && <div className="text-center py-6 text-gray-500 text-sm">No bank accounts configured.</div>}
        </div>
      </div>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed top-[56px] md:top-[80px] bottom-0 inset-x-0 z-[50] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-slate-50 rounded-2xl p-6 shadow-2xl">
              <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 cursor-pointer z-10"><X size={24} /></button>
              <h2 className="text-xl font-bold text-brand-blue mb-6">Edit Bank Account</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-theme-medium mb-1">Bank Name</label>
                  <input required type="text" value={editData.bank_name || ''} onChange={e => setEditData({ ...editData, bank_name: e.target.value })} className="w-full bg-white border border-slate-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-theme-medium mb-1">Account Name</label>
                  <input required type="text" value={editData.account_name || ''} onChange={e => setEditData({ ...editData, account_name: e.target.value })} className="w-full bg-white border border-slate-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-theme-medium mb-1">Account Number</label>
                  <input required type="text" value={editData.account_number || ''} onChange={e => setEditData({ ...editData, account_number: e.target.value })} className="w-full bg-white border border-slate-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium font-mono" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-theme-medium mb-1">Branch Name</label>
                  <input required type="text" value={editData.branch || ''} onChange={e => setEditData({ ...editData, branch: e.target.value })} className="w-full bg-white border border-slate-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium" />
                </div>
                <button type="submit" disabled={submitting} className="w-full bg-theme-deep text-white font-bold py-3 rounded mt-4 hover:bg-theme-darkest transition-colors cursor-pointer">
                  {submitting ? 'Saving...' : 'Save Changes'}
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
// STORE SETTINGS
// ==========================================
function StoreSettings() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState({ name: 'Alexandria Books', slogan: 'Tota est scientia', address: '', phone: '', email: '' });
  const [orderSequence, setOrderSequence] = useState({ prefix: '', current_value: 0, padding_length: 8 });
  const [notification, setNotification] = useState({ type: '', message: '' });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 5000);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('store_settings').select('*').limit(1).single();
      if (data) setSettings(data);
      else if (error && error.code !== 'PGRST116') console.error(error); // ignore 0 rows error initially
      
      const { data: seqData, error: seqError } = await supabase.from('order_sequence').select('*').eq('id', 1).single();
      if (seqData) setOrderSequence(seqData);
      else if (seqError && seqError.code !== 'PGRST116') console.error(seqError);
      
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Check if exists
    const { data: existing } = await supabase.from('store_settings').select('id').limit(1).single();

    let error = null;
    if (existing) {
      const { error: e } = await supabase.from('store_settings').update(settings).eq('id', existing.id);
      error = e;
    } else {
      const { error: e } = await supabase.from('store_settings').insert([settings]);
      error = e;
    }

    setSubmitting(false);
    if (error) showNotification('error', error.message);
    else showNotification('success', 'Store settings updated successfully.');
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Store Settings...</div>;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {notification.message && (
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-brand-blue mb-6 border-b border-gray-200 pb-2">Store Information</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-theme-medium font-bold mb-2">Store Name</label>
            <input required type="text" value={settings.name || ''} onChange={e => setSettings({ ...settings, name: e.target.value })} className="w-full bg-slate-50 border border-slate-300 px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-theme-medium font-bold mb-2">Slogan / Tagline</label>
            <input type="text" value={settings.slogan || ''} onChange={e => setSettings({ ...settings, slogan: e.target.value })} className="w-full bg-slate-50 border border-slate-300 px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-theme-medium font-bold mb-2">Physical Address</label>
            <textarea rows="3" value={settings.address || ''} onChange={e => setSettings({ ...settings, address: e.target.value })} className="w-full bg-slate-50 border border-slate-300 px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium resize-none" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-theme-medium font-bold mb-2">Contact Phone</label>
              <input type="tel" value={settings.phone || ''} onChange={e => setSettings({ ...settings, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-300 px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-theme-medium font-bold mb-2">Email Address</label>
              <input type="email" value={settings.email || ''} onChange={e => setSettings({ ...settings, email: e.target.value })} className="w-full bg-slate-50 border border-slate-300 px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-theme-deep text-white font-bold py-3 rounded mt-4 hover:bg-theme-darkest transition-colors cursor-pointer disabled:opacity-50 tracking-widest uppercase text-sm">
            {submitting ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-brand-blue mb-6 border-b border-gray-200 pb-2">Order ID Configuration</h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setSubmitting(true);
          const { error } = await supabase.from('order_sequence').upsert({
            id: 1,
            prefix: orderSequence.prefix,
            current_value: parseInt(orderSequence.current_value) || 0,
            padding_length: parseInt(orderSequence.padding_length) || 8
          });
          setSubmitting(false);
          if (error) showNotification('error', error.message);
          else showNotification('success', 'Order Sequence updated successfully.');
        }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-theme-medium font-bold mb-2">Prefix</label>
              <input type="text" value={orderSequence.prefix || ''} onChange={e => setOrderSequence({ ...orderSequence, prefix: e.target.value })} className="w-full bg-slate-50 border border-slate-300 px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium" placeholder="ORD-" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-theme-medium font-bold mb-2">Current Sequence Value</label>
              <input type="number" value={orderSequence.current_value} onChange={e => setOrderSequence({ ...orderSequence, current_value: e.target.value })} className="w-full bg-slate-50 border border-slate-300 px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-theme-medium font-bold mb-2">Padding Length</label>
              <input type="number" value={orderSequence.padding_length} onChange={e => setOrderSequence({ ...orderSequence, padding_length: e.target.value })} className="w-full bg-slate-50 border border-slate-300 px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-theme-medium" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-theme-deep text-white font-bold py-3 rounded mt-4 hover:bg-theme-darkest transition-colors cursor-pointer disabled:opacity-50 tracking-widest uppercase text-sm">
            {submitting ? 'Saving...' : 'Save Sequence Config'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ShippingSettings() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [speedConfig, setSpeedConfig] = useState({ base_weight: 250, base_price: 200, extra_weight: 250, extra_price: 50 });
  const [normalConfig, setNormalConfig] = useState({ tiers: [{max_weight: 250, price: 150}, {max_weight: 500, price: 200}, {max_weight: 1000, price: 250}], extra_weight: 1000, extra_price: 50 });
  const [slPostCodConfig, setSlPostCodConfig] = useState({
    service_charge: 50, max_value_price: 130, extra_weight: 1000, extra_price: 50,
    weight_tiers: [{max_weight: 250, price: 150}, {max_weight: 500, price: 200}, {max_weight: 1000, price: 350}],
    value_tiers: [{max_value: 1000, price: 40}, {max_value: 2000, price: 50}, {max_value: 3000, price: 60}, {max_value: 4000, price: 70}, {max_value: 5000, price: 80}, {max_value: 10000, price: 130}]
  });
  const [notification, setNotification] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    const { data } = await supabase.from('shipping_rates').select('*');
    if (data && data.length > 0) {
      data.forEach(rate => {
        if (rate.method_key === 'speed') setSpeedConfig(rate.config);
        if (rate.method_key === 'normal') setNormalConfig(rate.config);
        if (rate.method_key === 'sl_post_cod') setSlPostCodConfig(rate.config);
      });
    } else {
      // Create initial rows if empty
      await supabase.from('shipping_rates').insert([
        { method_key: 'speed', method_name: 'Speed Post', config: { base_weight: 250, base_price: 200, extra_weight: 250, extra_price: 50 } },
        { method_key: 'normal', method_name: 'Normal Post', config: { tiers: [{max_weight: 250, price: 150}, {max_weight: 500, price: 200}, {max_weight: 1000, price: 250}], extra_weight: 1000, extra_price: 50 } },
        { method_key: 'sl_post_cod', method_name: 'SL Post COD', config: { service_charge: 50, max_value_price: 130, extra_weight: 1000, extra_price: 50, weight_tiers: [{max_weight: 250, price: 150}, {max_weight: 500, price: 200}, {max_weight: 1000, price: 350}], value_tiers: [{max_value: 1000, price: 40}, {max_value: 2000, price: 50}, {max_value: 3000, price: 60}, {max_value: 4000, price: 70}, {max_value: 5000, price: 80}, {max_value: 10000, price: 130}] } }
      ]);
    }
    setLoading(false);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 5000);
  };

  const handleSave = async (methodKey, config) => {
    setSubmitting(true);
    const { error } = await supabase
      .from('shipping_rates')
      .update({ config })
      .eq('method_key', methodKey);
    if (error) showNotification('error', error.message);
    else showNotification('success', `${methodKey} rates updated!`);
    setSubmitting(false);
  };

  if (loading) return <div className="text-center py-10">Loading shipping settings...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-brand-blue">Shipping Rates Configuration</h2>
      </div>
      
      {notification.message && (
        <div className={`p-4 ${notification.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {notification.message}
        </div>
      )}

      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Speed Post */}
        <div className="border rounded-lg p-6 bg-slate-50">
          <h3 className="text-lg font-bold mb-4 uppercase tracking-wider text-theme-deep">Speed Post</h3>
          <div className="space-y-4">
            <div><label className="block text-xs font-bold mb-1 uppercase tracking-widest text-gray-500">Base Weight (g)</label><input type="number" value={speedConfig.base_weight} onChange={e => setSpeedConfig({...speedConfig, base_weight: Number(e.target.value)})} className="w-full border border-gray-300 p-2 rounded" /></div>
            <div><label className="block text-xs font-bold mb-1 uppercase tracking-widest text-gray-500">Base Price (Rs)</label><input type="number" value={speedConfig.base_price} onChange={e => setSpeedConfig({...speedConfig, base_price: Number(e.target.value)})} className="w-full border border-gray-300 p-2 rounded" /></div>
            <div><label className="block text-xs font-bold mb-1 uppercase tracking-widest text-gray-500">Extra Weight Step (g)</label><input type="number" value={speedConfig.extra_weight} onChange={e => setSpeedConfig({...speedConfig, extra_weight: Number(e.target.value)})} className="w-full border border-gray-300 p-2 rounded" /></div>
            <div><label className="block text-xs font-bold mb-1 uppercase tracking-widest text-gray-500">Extra Price (Rs)</label><input type="number" value={speedConfig.extra_price} onChange={e => setSpeedConfig({...speedConfig, extra_price: Number(e.target.value)})} className="w-full border border-gray-300 p-2 rounded" /></div>
            <button onClick={() => handleSave('speed', speedConfig)} disabled={submitting} className="w-full bg-theme-deep text-white font-bold py-2 rounded mt-4 hover:bg-theme-darkest uppercase tracking-widest text-sm">Save Speed Post</button>
          </div>
        </div>

        {/* Normal Post */}
        <div className="border rounded-lg p-6 bg-slate-50">
          <h3 className="text-lg font-bold mb-4 uppercase tracking-wider text-theme-deep">Normal Post</h3>
          <div className="space-y-4">
            {normalConfig.tiers.map((tier, idx) => (
              <div key={idx} className="flex gap-4 items-end bg-white p-3 rounded border">
                <div className="flex-1"><label className="block text-xs font-bold mb-1 uppercase tracking-widest text-gray-500">Max Weight (g)</label><input type="number" value={tier.max_weight} onChange={e => {
                  const newTiers = [...normalConfig.tiers];
                  newTiers[idx].max_weight = Number(e.target.value);
                  setNormalConfig({...normalConfig, tiers: newTiers});
                }} className="w-full border border-gray-300 p-2 rounded" /></div>
                <div className="flex-1"><label className="block text-xs font-bold mb-1 uppercase tracking-widest text-gray-500">Price (Rs)</label><input type="number" value={tier.price} onChange={e => {
                  const newTiers = [...normalConfig.tiers];
                  newTiers[idx].price = Number(e.target.value);
                  setNormalConfig({...normalConfig, tiers: newTiers});
                }} className="w-full border border-gray-300 p-2 rounded" /></div>
              </div>
            ))}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-bold text-sm mb-2 text-gray-600 uppercase tracking-widest">Beyond Max Tier</h4>
              <div><label className="block text-xs font-bold mb-1 uppercase tracking-widest text-gray-500">Extra Weight Step (g)</label><input type="number" value={normalConfig.extra_weight} onChange={e => setNormalConfig({...normalConfig, extra_weight: Number(e.target.value)})} className="w-full border border-gray-300 p-2 rounded" /></div>
              <div className="mt-4"><label className="block text-xs font-bold mb-1 uppercase tracking-widest text-gray-500">Extra Price (Rs)</label><input type="number" value={normalConfig.extra_price} onChange={e => setNormalConfig({...normalConfig, extra_price: Number(e.target.value)})} className="w-full border border-gray-300 p-2 rounded" /></div>
            </div>
            <button onClick={() => handleSave('normal', normalConfig)} disabled={submitting} className="w-full bg-theme-deep text-white font-bold py-2 rounded mt-4 hover:bg-theme-darkest uppercase tracking-widest text-sm">Save Normal Post</button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 border-t border-gray-200">
        <div className="border rounded-lg p-6 bg-slate-50">
          <h3 className="text-lg font-bold mb-4 uppercase tracking-wider text-theme-deep">SL Post COD</h3>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
             {/* General */}
             <div className="space-y-4">
                <h4 className="font-bold text-sm text-gray-600 uppercase tracking-widest">Base Fees & Limits</h4>
                <div><label className="block text-xs font-bold mb-1 uppercase tracking-widest text-gray-500">Service Charge (Rs)</label><input type="number" value={slPostCodConfig.service_charge} onChange={e => setSlPostCodConfig({...slPostCodConfig, service_charge: Number(e.target.value)})} className="w-full border border-gray-300 p-2 rounded" /></div>
                <div><label className="block text-xs font-bold mb-1 uppercase tracking-widest text-gray-500">Max Value Price (Rs) {'>'}10k</label><input type="number" value={slPostCodConfig.max_value_price} onChange={e => setSlPostCodConfig({...slPostCodConfig, max_value_price: Number(e.target.value)})} className="w-full border border-gray-300 p-2 rounded" /></div>
                <div><label className="block text-xs font-bold mb-1 uppercase tracking-widest text-gray-500">Extra Wt Step (g)</label><input type="number" value={slPostCodConfig.extra_weight} onChange={e => setSlPostCodConfig({...slPostCodConfig, extra_weight: Number(e.target.value)})} className="w-full border border-gray-300 p-2 rounded" /></div>
                <div><label className="block text-xs font-bold mb-1 uppercase tracking-widest text-gray-500">Extra Wt Price (Rs)</label><input type="number" value={slPostCodConfig.extra_price} onChange={e => setSlPostCodConfig({...slPostCodConfig, extra_price: Number(e.target.value)})} className="w-full border border-gray-300 p-2 rounded" /></div>
             </div>

             {/* Weight Tiers */}
             <div className="space-y-4">
                <div className="flex justify-between items-center"><h4 className="font-bold text-sm text-gray-600 uppercase tracking-widest">Weight Tiers</h4>
                <button onClick={() => setSlPostCodConfig({...slPostCodConfig, weight_tiers: [...slPostCodConfig.weight_tiers, {max_weight: 0, price: 0}]})} className="text-xs bg-theme-medium text-white px-3 py-1 rounded font-bold hover:bg-theme-darkest transition-colors">+ Add</button></div>
                <div className="space-y-2">
                  {slPostCodConfig.weight_tiers.map((tier, idx) => (
                    <div key={`w-${idx}`} className="flex gap-2 items-end bg-white p-2 rounded border shadow-sm">
                      <div className="flex-1"><label className="block text-[10px] font-bold mb-1 uppercase text-gray-500 tracking-wider">Max Wt (g)</label><input type="number" value={tier.max_weight} onChange={e => {
                        const nt = [...slPostCodConfig.weight_tiers]; nt[idx].max_weight = Number(e.target.value); setSlPostCodConfig({...slPostCodConfig, weight_tiers: nt});
                      }} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-1 focus:ring-theme-medium outline-none" /></div>
                      <div className="flex-1"><label className="block text-[10px] font-bold mb-1 uppercase text-gray-500 tracking-wider">Price (Rs)</label><input type="number" value={tier.price} onChange={e => {
                        const nt = [...slPostCodConfig.weight_tiers]; nt[idx].price = Number(e.target.value); setSlPostCodConfig({...slPostCodConfig, weight_tiers: nt});
                      }} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-1 focus:ring-theme-medium outline-none" /></div>
                      <button onClick={() => {
                        const nt = [...slPostCodConfig.weight_tiers]; nt.splice(idx, 1); setSlPostCodConfig({...slPostCodConfig, weight_tiers: nt});
                      }} className="text-red-500 font-bold px-2 py-1.5 hover:bg-red-50 rounded transition-colors" title="Remove">X</button>
                    </div>
                  ))}
                </div>
             </div>

             {/* Value Tiers */}
             <div className="space-y-4">
                <div className="flex justify-between items-center"><h4 className="font-bold text-sm text-gray-600 uppercase tracking-widest">Value Tiers</h4>
                <button onClick={() => setSlPostCodConfig({...slPostCodConfig, value_tiers: [...slPostCodConfig.value_tiers, {max_value: 0, price: 0}]})} className="text-xs bg-theme-medium text-white px-3 py-1 rounded font-bold hover:bg-theme-darkest transition-colors">+ Add</button></div>
                <div className="max-h-64 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                  {slPostCodConfig.value_tiers.map((tier, idx) => (
                    <div key={`v-${idx}`} className="flex gap-2 items-end bg-white p-2 rounded border shadow-sm">
                      <div className="flex-1"><label className="block text-[10px] font-bold mb-1 uppercase text-gray-500 tracking-wider">Max Val (Rs)</label><input type="number" value={tier.max_value} onChange={e => {
                        const nt = [...slPostCodConfig.value_tiers]; nt[idx].max_value = Number(e.target.value); setSlPostCodConfig({...slPostCodConfig, value_tiers: nt});
                      }} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-1 focus:ring-theme-medium outline-none" /></div>
                      <div className="flex-1"><label className="block text-[10px] font-bold mb-1 uppercase text-gray-500 tracking-wider">Price (Rs)</label><input type="number" value={tier.price} onChange={e => {
                        const nt = [...slPostCodConfig.value_tiers]; nt[idx].price = Number(e.target.value); setSlPostCodConfig({...slPostCodConfig, value_tiers: nt});
                      }} className="w-full border border-gray-300 p-1.5 text-sm rounded focus:ring-1 focus:ring-theme-medium outline-none" /></div>
                      <button onClick={() => {
                        const nt = [...slPostCodConfig.value_tiers]; nt.splice(idx, 1); setSlPostCodConfig({...slPostCodConfig, value_tiers: nt});
                      }} className="text-red-500 font-bold px-2 py-1.5 hover:bg-red-50 rounded transition-colors" title="Remove">X</button>
                    </div>
                  ))}
                </div>
             </div>
          </div>
          <button onClick={() => handleSave('sl_post_cod', slPostCodConfig)} disabled={submitting} className="w-full bg-theme-deep text-white font-bold py-3 rounded mt-6 hover:bg-theme-darkest uppercase tracking-widest text-sm transition-colors shadow-sm">Save SL Post COD</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// DATABASE MANAGEMENT (Backup & Restore)
// ==========================================
function DatabaseManagement({ userRole }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [restoreMode, setRestoreMode] = useState('merge');

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 6000);
  };

  const tablesToBackup = ['books', 'categories', 'orders', 'order_items', 'store_settings', 'publishers', 'contributors'];
  const bucketsToBackup = ['book-covers', 'publisher-logos', 'banners', 'payment-proofs'];

  const downloadFileAsBlob = async (bucket, path) => {
    try {
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn(`Failed to download ${path} from ${bucket}:`, e);
      return null;
    }
  };

  const handleBackup = async () => {
    if (!window.confirm("Do you want to start a full system backup? This might take a few minutes.")) return;
    setLoading(true);
    setProgress('Initializing backup...');
    
    try {
      const zip = new JSZip();
      
      // 1. Backup Tables
      setProgress('Backing up database tables...');
      const dbData = {};
      for (const table of tablesToBackup) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw new Error(`Error backing up table ${table}: ${error.message}`);
        dbData[table] = data;
      }
      zip.file('database_backup.json', JSON.stringify(dbData, null, 2));

      // 2. Backup Buckets
      setProgress('Backing up storage buckets (this may take a while)...');
      const storageFolder = zip.folder('storage');
      
      for (const bucket of bucketsToBackup) {
        const { data: files, error } = await supabase.storage.from(bucket).list();
        if (error) {
          console.warn(`Could not list bucket ${bucket}`, error);
          continue;
        }
        if (files && files.length > 0) {
          const bucketFolder = storageFolder.folder(bucket);
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.name === '.emptyFolderPlaceholder') continue;
            setProgress(`Downloading ${bucket}/${file.name} (${i + 1}/${files.length})...`);
            const blob = await downloadFileAsBlob(bucket, file.name);
            if (blob) {
              bucketFolder.file(file.name, blob);
            }
          }
        }
      }

      setProgress('Compressing files into a ZIP archive...');
      const content = await zip.generateAsync({ type: 'blob' });
      const dateStr = new Date().toISOString().split('T')[0];
      saveAs(content, `bookstore_full_backup_${dateStr}.zip`);
      
      showNotification('success', 'Backup completed successfully!');
    } catch (err) {
      console.error(err);
      showNotification('error', `Backup failed: ${err.message}`);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!window.confirm(`WARNING: You selected ${restoreMode.toUpperCase()} mode. Are you sure you want to proceed?`)) {
      e.target.value = null;
      return;
    }

    setLoading(true);
    setProgress('Reading ZIP file...');
    
    try {
      const zip = await JSZip.loadAsync(file);
      
      // 1. Restore Database Tables
      if (zip.file('database_backup.json')) {
        setProgress('Restoring database tables...');
        const dbDataRaw = await zip.file('database_backup.json').async('string');
        const dbData = JSON.parse(dbDataRaw);
        
        if (restoreMode === 'overwrite') {
           setProgress('Wiping current database tables (Overwrite mode)...');
           const deleteOrder = ['order_items', 'orders', 'books', 'publishers', 'contributors', 'categories', 'store_settings'];
           for (const table of deleteOrder) {
             const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
             if (error) console.warn(`Wipe warning on ${table}:`, error);
           }
        }
        
        // Disable foreign key checks is tricky via REST API, we rely on upsert and order
        const insertOrder = ['categories', 'contributors', 'publishers', 'store_settings', 'books', 'orders', 'order_items'];
        
        for (const table of insertOrder) {
          if (dbData[table] && dbData[table].length > 0) {
            setProgress(`Restoring table: ${table}...`);
            const { error } = await supabase.from(table).upsert(dbData[table], { ignoreDuplicates: false });
            if (error) console.error(`Failed to restore table ${table}:`, error);
          }
        }
      }

      // 2. Restore Storage Buckets
      setProgress('Restoring storage buckets...');
      for (const bucket of bucketsToBackup) {
        const folder = zip.folder(`storage/${bucket}`);
        if (folder) {
          const files = Object.keys(folder.files).filter(k => !folder.files[k].dir);
          for (let i = 0; i < files.length; i++) {
            const pathKey = files[i];
            const fileName = pathKey.split('/').pop();
            setProgress(`Uploading ${bucket}/${fileName} (${i + 1}/${files.length})...`);
            
            const fileObj = folder.files[pathKey];
            const fileData = await fileObj.async('blob');
            const { error } = await supabase.storage.from(bucket).upload(fileName, fileData, {
              upsert: true
            });
            if (error) console.error(`Failed to upload ${fileName} to ${bucket}:`, error);
          }
        }
      }

      showNotification('success', 'Restore completed successfully!');
    } catch (err) {
      console.error(err);
      showNotification('error', `Restore failed: ${err.message}`);
    } finally {
      setLoading(false);
      setProgress('');
      e.target.value = null;
    }
  };

  const handleWipeData = async () => {
    if (userRole !== 'OWNER') return;
    
    const confirm1 = window.prompt("DANGER ZONE: Type 'DELETE ALL' to confirm you want to wipe all store data (books, orders, etc.). This cannot be undone.");
    if (confirm1 !== 'DELETE ALL') return;

    setLoading(true);
    setProgress('Wiping database...');
    
    try {
      // Order matters to avoid foreign key violations
      const deleteOrder = ['order_items', 'orders', 'books', 'publishers', 'contributors', 'categories'];
      
      for (const table of deleteOrder) {
        setProgress(`Wiping table: ${table}...`);
        // Note: To delete all rows safely using Supabase JS without equality filters, we use not('id', 'is', null) or similar.
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Hack to delete all rows
        if (error) throw error;
      }
      
      showNotification('success', 'All store data has been wiped.');
    } catch (err) {
      console.error(err);
      showNotification('error', `Wipe failed: ${err.message}`);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl">
      <div className="p-6 border-b border-gray-200 bg-slate-50 flex items-center gap-3">
        <Database size={24} className="text-theme-deep" />
        <div>
          <h2 className="text-xl font-bold text-brand-blue">System Backup & Restore</h2>
          <p className="text-sm text-gray-500">Backup your entire database and uploaded files to a ZIP file.</p>
        </div>
      </div>
      
      <div className="p-6 space-y-8">
        {notification.message && (
          <div className={`p-4 rounded-lg border flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {loading && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between animate-pulse">
            <span className="font-bold text-blue-800">{progress}</span>
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BACKUP */}
          <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <Download size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Create Full Backup</h3>
              <p className="text-sm text-slate-600 mb-6">
                Downloads all database tables (books, orders, etc.) and all uploaded files (images, logos) into a single ZIP archive.
              </p>
            </div>
            <button 
              disabled={loading} 
              onClick={handleBackup}
              className="w-full bg-theme-deep text-white font-bold py-3 rounded-lg hover:bg-theme-darkest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download size={18} /> Download Backup (ZIP)
            </button>
          </div>

          {/* RESTORE */}
          <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <Upload size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Restore from Backup</h3>
              <p className="text-sm text-slate-600 mb-4">
                Upload a `.zip` backup to restore tables and files.
              </p>
              
              <div className="bg-white p-3 rounded-lg border border-slate-200 mb-6 space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" name="restoreMode" value="merge" checked={restoreMode === 'merge'} onChange={(e) => setRestoreMode(e.target.value)} className="mt-1 accent-green-600" />
                  <div>
                    <span className="block font-bold text-sm text-slate-800">Merge Data (Safe)</span>
                    <span className="block text-xs text-slate-500">Updates existing records and adds new ones. Does not delete current data.</span>
                  </div>
                </label>
                <label className="flex items-start gap-2 cursor-pointer border-t border-slate-100 pt-2">
                  <input type="radio" name="restoreMode" value="overwrite" checked={restoreMode === 'overwrite'} onChange={(e) => setRestoreMode(e.target.value)} className="mt-1 accent-red-600" />
                  <div>
                    <span className="block font-bold text-sm text-red-600">Overwrite All Data (Dangerous)</span>
                    <span className="block text-xs text-slate-500">Wipes all current books, orders, etc., before inserting backup data.</span>
                  </div>
                </label>
              </div>
            </div>
            <div className="relative mt-auto">
              <input 
                type="file" 
                accept=".zip" 
                disabled={loading}
                onChange={handleRestore}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
              />
              <button 
                disabled={loading}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 pointer-events-none"
              >
                <Upload size={18} /> Upload & Restore
              </button>
            </div>
          </div>
        </div>

        {/* FACTORY RESET (OWNER ONLY) */}
        {userRole === 'OWNER' && (
          <div className="mt-8 border-2 border-red-200 rounded-xl p-6 bg-red-50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle size={24} />
                <h3 className="text-lg font-bold">Danger Zone: Wipe All Data</h3>
              </div>
              <p className="text-sm text-red-800">
                Permanently deletes all books, orders, contributors, publishers, and categories from the database. Use this to factory reset the system. This action cannot be undone.
              </p>
            </div>
            <button 
              disabled={loading}
              onClick={handleWipeData}
              className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <Trash2 size={18} /> Wipe All Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
