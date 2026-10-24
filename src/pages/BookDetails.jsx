import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Tag, Layers, CheckCircle2, ChevronLeft } from 'lucide-react';
import { formatPrice } from '../lib/utils';

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();
  const [book, setBook] = useState(null);
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  const [buyQty, setBuyQty] = useState(1);
  
  const [authorInfo, setAuthorInfo] = useState(null);
  const [translatorInfo, setTranslatorInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookAndPeople = async () => {
      const { data: bookData } = await supabase.from('books').select('*').eq('id', id).single();
      if (bookData) {
        setBook(bookData);
        
        // Fetch Author
        const { data: authorData } = await supabase.from('contributors').select('*').eq('name_en', bookData.author).single();
        if (authorData) setAuthorInfo(authorData);

        // Fetch Translator
        if (bookData.translator) {
          const { data: translatorData } = await supabase.from('contributors').select('*').eq('name_en', bookData.translator).single();
          if (translatorData) setTranslatorInfo(translatorData);
        }
      }
      setLoading(false);
    };
    fetchBookAndPeople();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-brand-blue font-serif text-2xl animate-pulse">Retrieving masterpiece...</div>;
  if (!book) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-serif text-xl">Book not found.</div>;

  const fallbackImage = 'https://placehold.co/800x1200/f1f1f1/0b1d3a?text=No+Cover';
  
  const cartItem = cart.find(item => item.id === book.id);
  const isStockLimitReached = cartItem && cartItem.quantity >= book.stock;

  const handleBuyNow = () => {
    if (!book || book.stock <= 0 || isStockLimitReached) return;
    addToCart({ ...book, price: book.discount_percentage > 0 && book.sale_price ? book.sale_price : book.price });
    navigate('/checkout');
  };

  return (
    <>
      {/* DESKTOP VIEW (Keep existing desktop UI) */}
      <div className="hidden md:block">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen pb-12 pt-8 bg-brand-offwhite px-8">
          <div className="max-w-6xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-brand-blue transition-colors mb-10 text-sm tracking-widest uppercase font-semibold cursor-pointer">
              <ArrowLeft size={16} /> Back to Collection
            </button>

            <div className="flex flex-row gap-12 items-start">
              <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="relative group w-full max-w-md rounded-xl overflow-hidden shadow-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-center">
                <img src={book.cover_image_url || fallbackImage} alt={book.title} onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }} className="object-contain h-[60vh] w-full max-w-full mx-auto rounded-xl shadow-sm" />
              </motion.div>

              <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex-1 space-y-8 bg-slate-50 p-8 rounded-xl shadow-sm border border-slate-200">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {book.is_featured && <span className="bg-brand-gold text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded shadow-sm">Featured</span>}
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag size={12} className="text-gray-500" />
                      {(book.categories && book.categories.length > 0) ? (
                        book.categories.map(category => (
                          <Link key={category} to={'/?category=' + encodeURIComponent(category)} className="bg-theme-light/20 text-theme-deep px-4 py-1.5 rounded-full hover:bg-theme-medium hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
                            {category}
                          </Link>
                        ))
                      ) : (
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">General</span>
                      )}
                    </div>
                  </div>
                  <h1 className="text-4xl font-serif text-brand-blue mb-6 leading-tight font-bold">{book.title}</h1>
                  
                  <div className="flex flex-col gap-4 mb-8">
                    {/* Author Avatar & Dual Name */}
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100 w-max pr-8 shadow-sm">
                       <div className="w-12 h-12 relative overflow-hidden rounded-full bg-theme-light/50 flex items-center justify-center border-2 border-white shadow-sm">
                          <span className="text-xl font-bold text-theme-deep">{book.author.charAt(0).toUpperCase()}</span>
                       </div>
                       <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Author</span>
                          <Link to={`/author/${encodeURIComponent(book.author)}`} className="font-bold text-theme-darkest leading-none mt-1 hover:text-theme-medium hover:underline underline-offset-4 cursor-pointer block">{book.author}</Link>
                          {authorInfo?.name_si && <p className="text-xs text-slate-500 font-semibold mt-1">{authorInfo.name_si}</p>}
                       </div>
                    </div>

                    {/* Translator Avatar & Dual Name */}
                    {book.translator && (
                      <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100 w-max pr-8 shadow-sm">
                         <div className="w-12 h-12 relative overflow-hidden rounded-full bg-theme-light/50 flex items-center justify-center border-2 border-white shadow-sm">
                            <span className="text-xl font-bold text-theme-deep">{book.translator.charAt(0).toUpperCase()}</span>
                         </div>
                         <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Translator</span>
                            <Link to={`/translator/${encodeURIComponent(book.translator)}`} className="font-bold text-theme-darkest leading-none mt-1 hover:text-theme-medium hover:underline underline-offset-4 cursor-pointer block">{book.translator}</Link>
                            {translatorInfo?.name_si && <p className="text-xs text-slate-500 font-semibold mt-1">{translatorInfo.name_si}</p>}
                         </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 mb-6">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Publisher</span>
                      {book.publisher ? (
                        <Link to={`/publishers/${encodeURIComponent(book.publisher)}`} className="font-semibold text-slate-800 hover:text-theme-medium hover:underline underline-offset-4 cursor-pointer block mt-1">{book.publisher}</Link>
                      ) : (
                        <p className="font-semibold text-slate-800 mt-1">N/A</p>
                      )}
                    </div>
                    <div><span className="text-xs font-bold uppercase tracking-widest text-slate-400">Weight</span><p className="font-semibold text-slate-800">{book.weight_g ? `${book.weight_g}g` : '250g'}</p></div>
                    {book.page_count && (
                      <div><span className="text-xs font-bold uppercase tracking-widest text-slate-400">Pages</span><p className="font-semibold text-slate-800">{book.page_count}</p></div>
                    )}
                  </div>

                  <div className="flex items-center gap-6 border-y border-gray-200 py-6 my-6">
                    <div className="flex flex-col">
                      {book.discount_percentage > 0 && book.sale_price ? (
                        <>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-theme-deep">{formatPrice(book.sale_price)}</span>
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">-{book.discount_percentage}%</span>
                          </div>
                          <span className="text-sm text-gray-400 line-through mt-1">{formatPrice(book.price)}</span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-theme-deep">{formatPrice(book.price)}</span>
                      )}
                    </div>
                    <div className="h-10 w-px bg-gray-200"></div>
                    <div className="flex items-center gap-2">
                      {book.stock > 0 ? (
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={16} className="text-green-600" />
                            <span className="bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">In Stock</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-600">Available Stock: {book.stock} copies</span>
                        </div>
                      ) : (
                        <span className="bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full text-xs shadow-md">Out of Stock</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-brand-blue mb-3 flex items-center gap-2"><Layers size={16}/> Synopsis</h3>
                  <p className="text-gray-600 text-base leading-relaxed mt-6 whitespace-pre-line">{book.description}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
                  <button 
                    onClick={() => addToCart({ ...book, price: book.discount_percentage > 0 && book.sale_price ? book.sale_price : book.price })}
                    disabled={book.stock <= 0 || isStockLimitReached}
                    className="flex-1 py-3 px-4 border-2 border-theme-deep text-theme-deep font-bold rounded-xl hover:bg-theme-light/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={20} /> {book.stock <= 0 ? 'Unavailable' : isStockLimitReached ? 'Max Reached' : 'Add to Cart'}
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      setBuyQty(1); 
                      setShowBuyNowModal(true); 
                    }}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* MOBILE VIEW (Strictly Optimized for No Overflow and Bottom Nav Visibility) */}
      <div className="flex flex-col w-full max-w-full overflow-x-hidden min-h-screen bg-gray-50 pb-24 md:hidden">
        
        {/* COMPACT TOP NAVIGATION BAR */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 h-12 flex items-center px-4 w-full shrink-0">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-blue-600 active:text-blue-800 font-semibold text-sm transition-colors py-2"
          >
            <ChevronLeft className="w-5 h-5 mr-1"/>
            Back to Collection
          </button>
        </div>

        {/* MAIN BOOK CONTENT WRAPPER */}
        <div className="flex-1 w-full px-4 pt-5">
          <div className="w-full max-w-full break-words">
            
            {/* Book Cover */}
            <div className="w-full flex justify-center mb-6">
              <div className="w-48 max-w-[200px] rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white p-3 flex items-center justify-center">
                <img 
                  src={book.cover_image_url || fallbackImage} 
                  alt={book.title} 
                  onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }} 
                  className="object-contain h-64 w-full rounded-lg shadow-sm" 
                />
              </div>
            </div>

            {/* Tags & Categories */}
            <div className="flex flex-wrap items-center gap-2 mb-3 w-full">
              {book.is_featured && (
                <span className="bg-brand-gold text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm">
                  Featured
                </span>
              )}
              <div className="flex flex-wrap items-center gap-1.5">
                <Tag size={12} className="text-gray-400" />
                {(book.categories && book.categories.length > 0) ? (
                  book.categories.map(category => (
                    <Link 
                      key={category} 
                      to={'/?category=' + encodeURIComponent(category)} 
                      className="bg-theme-light/20 text-theme-deep px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                    >
                      {category}
                    </Link>
                  ))
                ) : (
                  <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">General</span>
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-serif text-brand-blue mb-4 leading-snug font-bold break-words w-full">
              {book.title}
            </h1>

            {/* Author & Translator Cards */}
            <div className="flex flex-col gap-3 mb-5 w-full">
              {/* Author */}
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 w-full shadow-sm">
                <div className="w-10 h-10 shrink-0 overflow-hidden rounded-full bg-theme-light/50 flex items-center justify-center border-2 border-white shadow-sm">
                  <span className="text-lg font-bold text-theme-deep">{book.author.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Author</span>
                  <Link to={`/author/${encodeURIComponent(book.author)}`} className="font-bold text-theme-darkest text-sm hover:text-theme-medium hover:underline block truncate">
                    {book.author}
                  </Link>
                  {authorInfo?.name_si && <p className="text-xs text-slate-500 font-medium truncate">{authorInfo.name_si}</p>}
                </div>
              </div>

              {/* Translator */}
              {book.translator && (
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 w-full shadow-sm">
                  <div className="w-10 h-10 shrink-0 overflow-hidden rounded-full bg-theme-light/50 flex items-center justify-center border-2 border-white shadow-sm">
                    <span className="text-lg font-bold text-theme-deep">{book.translator.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Translator</span>
                    <Link to={`/translator/${encodeURIComponent(book.translator)}`} className="font-bold text-theme-darkest text-sm hover:text-theme-medium hover:underline block truncate">
                      {book.translator}
                    </Link>
                    {translatorInfo?.name_si && <p className="text-xs text-slate-500 font-medium truncate">{translatorInfo.name_si}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-white rounded-xl border border-gray-200 mb-5 w-full shadow-sm">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Publisher</span>
                {book.publisher ? (
                  <Link to={`/publishers/${encodeURIComponent(book.publisher)}`} className="font-semibold text-slate-800 text-xs hover:text-theme-medium block truncate mt-0.5">
                    {book.publisher}
                  </Link>
                ) : (
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">N/A</p>
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Weight</span>
                <p className="font-semibold text-slate-800 text-xs mt-0.5">{book.weight_g ? `${book.weight_g}g` : '250g'}</p>
              </div>
              {book.page_count && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Pages</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">{book.page_count}</p>
                </div>
              )}
            </div>

            {/* Price & Stock */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-gray-200 mb-5 w-full shadow-sm">
              <div className="flex flex-col">
                {book.discount_percentage > 0 && book.sale_price ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-theme-deep">{formatPrice(book.sale_price)}</span>
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">-{book.discount_percentage}%</span>
                    </div>
                    <span className="text-xs text-gray-400 line-through">{formatPrice(book.price)}</span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-theme-deep">{formatPrice(book.price)}</span>
                )}
              </div>

              <div>
                {book.stock > 0 ? (
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-green-600" />
                      <span className="bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">In Stock</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">{book.stock} copies</span>
                  </div>
                ) : (
                  <span className="bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full text-xs shadow-sm">Out of Stock</span>
                )}
              </div>
            </div>

            {/* Synopsis */}
            <div className="mb-6 w-full">
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-blue mb-2 flex items-center gap-1.5">
                <Layers size={14}/> Synopsis
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                {book.description}
              </p>
            </div>

            {/* Buy Now & Add to Cart Buttons */}
            <div className="flex flex-col gap-2.5 w-full mb-4">
              <button 
                onClick={() => addToCart({ ...book, price: book.discount_percentage > 0 && book.sale_price ? book.sale_price : book.price })}
                disabled={book.stock <= 0 || isStockLimitReached}
                className="w-full py-3.5 rounded-xl border-2 border-theme-deep text-theme-deep bg-white font-bold text-sm shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={18} /> {book.stock <= 0 ? 'Unavailable' : isStockLimitReached ? 'Max Reached' : 'Add to Cart'}
              </button>
              <button 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  setBuyQty(1); 
                  setShowBuyNowModal(true); 
                }}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                Buy Now
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* DIRECT PURCHASE QUANTITY MODAL */}
      {showBuyNowModal && (
        // z-[100] ensures it sits completely above the mobile bottom nav bar (which is usually z-40 or z-50)
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
          
          <div className="bg-white w-full md:w-96 rounded-t-3xl md:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 pb-10 md:pb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Direct Purchase</h3>
            
            {/* Qty Selector */}
            <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-gray-700 font-semibold">Quantity:</span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setBuyQty(prev => Math.max(1, prev - 1))}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100 active:scale-95 text-xl transition-all"
                >-</button>
                <span className="font-bold text-xl w-6 text-center">{buyQty}</span>
                <button 
                  onClick={() => setBuyQty(prev => prev + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100 active:scale-95 text-xl transition-all"
                >+</button>
              </div>
            </div>

            <div className="flex gap-3">
              {/* Cancel Button */}
              <button 
                onClick={() => setShowBuyNowModal(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              
              {/* Checkout Button - Restored to Blue Theme */}
              <button 
                onClick={() => {
                  const effectivePrice = book.discount_percentage > 0 && book.sale_price ? book.sale_price : book.price;
                  const directItem = { ...book, price: effectivePrice, quantity: buyQty }; 
                  sessionStorage.setItem('direct_buy_item', JSON.stringify(directItem));
                  setShowBuyNowModal(false);
                  navigate('/checkout?mode=direct');
                }}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
