import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import BookCard from '../components/BookCard';
import { User, Library, PenTool, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage({ type }) {
  const { name } = useParams();
  const navigate = useNavigate();
  const decodedName = decodeURIComponent(name);
  const [books, setBooks] = useState([]);
  const [profileInfo, setProfileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch the specific entity's profile information if available
      if (type === 'author' || type === 'translator') {
        const { data } = await supabase.from('contributors').select('*').eq('name_en', decodedName).single();
        if (data) setProfileInfo(data);
      }

      // Fetch the books matching the name for the given column
      const { data: booksData } = await supabase
        .from('books')
        .select('*')
        .eq(type, decodedName)
        .or('is_special.is.null,is_special.eq.false')
        .order('created_at', { ascending: false });

      if (booksData) setBooks(booksData);
      setLoading(false);
    };

    fetchData();
  }, [type, decodedName]);

  const getIcon = () => {
    switch (type) {
      case 'author': return <PenTool size={28} className="text-brand-blue" />;
      case 'translator': return <User size={28} className="text-brand-blue" />;
      case 'publisher': return <Library size={28} className="text-brand-blue" />;
      default: return <User size={28} className="text-brand-blue" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'author': return 'Books by Author';
      case 'translator': return 'Translated by';
      case 'publisher': return 'Published by';
      default: return 'Collection';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Section (Author/Publisher Name) */}
      <div className="bg-white px-4 py-4 md:py-5 shadow-sm mb-4 sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center gap-3 md:gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-blue-600 active:text-blue-800 font-semibold text-sm transition-colors cursor-pointer py-1 -ml-1 pr-1 shrink-0"
          >
            <ChevronLeft className="w-5 h-5 mr-0.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-theme-light/30 rounded-full flex items-center justify-center border border-slate-200 shrink-0">
            {getIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 block truncate">{getTitle()}</span>
            <h1 className="text-lg md:text-2xl font-serif text-brand-blue font-bold leading-tight truncate">{decodedName}</h1>
            {profileInfo?.name_si && (
              <h2 className="text-xs md:text-sm text-slate-500 font-medium truncate">{profileInfo.name_si}</h2>
            )}
          </div>
        </div>
      </div>

      {/* 2. THE BOOK GRID CONTAINER (THE FIX) */}
      <div className="px-4 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-medium animate-pulse">Loading collection...</div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {books.map((book) => (
              <div key={book.id} className="w-full flex">
                <BookCard book={book} addToCart={addToCart} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-2xl border border-slate-100 shadow-sm mt-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">No Books Found</h2>
            <p className="text-slate-500 font-medium">We couldn't find any books for this {type}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
