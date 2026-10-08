import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft, Tag, Layers, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../lib/utils';

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();
  const [book, setBook] = useState(null);
  
  const [authorInfo, setAuthorInfo] = useState(null);
  const [translatorInfo, setTranslatorInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookAndPeople = async () => {
      const { data: bookData } = await supabase.from('books').select('*').eq('id', id).single();
      if (bookData) {
        setBook(bookData);
        
        // Fetch Author
        const { data: authorData } = await supabase.from('authors').select('*').eq('name_en', bookData.author).single();
        if (authorData) setAuthorInfo(authorData);

        // Fetch Translator
        if (bookData.translator) {
          const { data: translatorData } = await supabase.from('translators').select('*').eq('name_en', bookData.translator).single();
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen pt-4 pb-20 bg-brand-offwhite">
      <div className="max-w-6xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-brand-blue transition-colors mb-10 text-sm tracking-widest uppercase font-semibold cursor-pointer">
          <ArrowLeft size={16} /> Back to Collection
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="relative group rounded-xl overflow-hidden shadow-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-center">
            <img src={book.cover_image_url || fallbackImage} alt={book.title} onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }} className="h-[45vh] md:h-[60vh] w-auto max-w-full object-contain mx-auto rounded-xl shadow-sm" />
          </motion.div>

          <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="space-y-8 bg-slate-50 p-8 rounded-xl shadow-sm border border-slate-200">
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
              <h1 className="text-4xl md:text-5xl font-serif text-brand-blue mb-6 leading-tight font-bold">{book.title}</h1>
              
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
                <div><span className="text-xs font-bold uppercase tracking-widest text-slate-400">Weight</span><p className="font-semibold text-slate-800">{book.weight || 'N/A'}</p></div>
              </div>

              <div className="flex items-center gap-6 border-y border-gray-200 py-6 my-6">
                <div className="flex flex-col">
                  {book.discount_percentage > 0 && book.sale_price ? (
                    <>
                      <span className="text-sm text-slate-400 line-through">{formatPrice(book.price)}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-4xl font-bold text-blue-600">{formatPrice(book.sale_price)}</span>
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">-{book.discount_percentage}%</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-4xl font-serif text-brand-blue font-bold">{formatPrice(book.price)}</span>
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
              <p className="text-gray-600 leading-relaxed text-sm md:text-base whitespace-pre-line">{book.description}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full">
              <button 
                onClick={handleBuyNow}
                disabled={book.stock <= 0 || isStockLimitReached}
                className="w-full md:w-64 flex items-center justify-center gap-3 bg-theme-deep text-white shadow-md hover:bg-theme-darkest transition-all duration-300 hover:shadow-lg px-8 py-4 rounded-full uppercase tracking-widest font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
              <button 
                onClick={() => addToCart({ ...book, price: book.discount_percentage > 0 && book.sale_price ? book.sale_price : book.price })}
                disabled={book.stock <= 0 || isStockLimitReached}
                className="w-full md:w-64 flex items-center justify-center gap-3 border-2 border-theme-deep text-theme-deep hover:bg-theme-deep hover:text-white transition-all duration-300 px-8 py-3.5 rounded-full uppercase tracking-widest font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
              >
                <ShoppingCart size={20} /> {book.stock <= 0 ? 'Unavailable' : isStockLimitReached ? 'Max Reached' : 'Add to Cart'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
