import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import BookCard from '../components/BookCard';
import { User, Library, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage({ type }) {
  const { name } = useParams();
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
    <div className="w-full">
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-6 mb-10"
      >
        <div className="w-20 h-20 bg-theme-light/30 rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0">
          {getIcon()}
        </div>
        <div>
          <span className="text-sm font-bold uppercase tracking-widest text-slate-400">{getTitle()}</span>
          <h1 className="text-3xl md:text-4xl font-serif text-brand-blue font-bold mt-1">{decodedName}</h1>
          {profileInfo?.name_si && (
            <h2 className="text-lg text-slate-600 font-semibold mt-1">{profileInfo.name_si}</h2>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-medium animate-pulse">Loading collection...</div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
          {books.map(book => (
            <div key={book.id} className="w-full flex justify-center min-w-[220px] max-w-[280px] mx-auto md:max-w-none">
              <BookCard book={book} addToCart={addToCart} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-2xl border border-slate-100 shadow-sm mt-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">No Books Found</h2>
          <p className="text-slate-500 font-medium">We couldn't find any books for this {type}.</p>
        </div>
      )}
    </div>
  );
}
