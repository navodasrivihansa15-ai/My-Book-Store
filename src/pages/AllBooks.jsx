import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import BookCard from '../components/BookCard';

export default function AllBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchBooks = async () => {
      const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false });
      if (data) setBooks(data);
      setLoading(false);
    };
    fetchBooks();
  }, []);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">All Books</h2>
      </div>
      
      {loading ? (
        <div className="text-center py-20 text-slate-500 font-medium">Loading books...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 lg:gap-8">
          {books.map(book => (
            <div key={book.id} className="w-full flex justify-center">
              <BookCard book={book} addToCart={addToCart} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
