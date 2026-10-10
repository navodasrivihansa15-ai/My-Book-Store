import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import BookCard from '../components/BookCard';

export default function Publishers() {
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPublisher, setSelectedPublisher] = useState(null);
  const [publisherBooks, setPublisherBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);

  useEffect(() => {
    const fetchPublishers = async () => {
      const { data, error } = await supabase.from('publishers').select('*').order('name');
      if (data) setPublishers(data);
      setLoading(false);
    };
    fetchPublishers();
  }, []);

  const handlePublisherClick = async (publisher) => {
    setSelectedPublisher(publisher);
    setBooksLoading(true);
    const { data, error } = await supabase.from('books').select('*').eq('publisher', publisher.name).or('is_special.is.null,is_special.eq.false').order('created_at', { ascending: false });
    if (data) setPublisherBooks(data);
    setBooksLoading(false);
  };

  if (loading) {
    return (
      <div className="w-full text-center py-32 bg-white rounded-2xl shadow-sm border border-theme-light/30 mt-8">
        <div className="w-12 h-12 border-4 border-theme-medium border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-theme-medium font-medium">Loading publishers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="w-full text-center py-16 bg-white rounded-2xl border border-theme-light/30 shadow-md">
        <h2 className="text-4xl font-serif font-bold text-theme-darkest mb-4">
          {selectedPublisher ? `Books by ${selectedPublisher.name}` : 'Our Publishers'}
        </h2>
        <p className="text-theme-medium font-medium">
          {selectedPublisher ? `Explore the entire collection published by ${selectedPublisher.name}.` : "We partner with the world's leading publishers."}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedPublisher ? (
          <motion.div key="grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
            {publishers.map(pub => (
              <div 
                key={pub.id} 
                onClick={() => handlePublisherClick(pub)}
                className="bg-white rounded-xl shadow-md border border-theme-light/30 p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-24 h-24 relative overflow-hidden rounded-full bg-theme-bg flex items-center justify-center p-2 border border-theme-light/30 group-hover:border-theme-medium transition-colors">
                  {pub.logo_url ? (
                    <img src={pub.logo_url} alt={pub.name} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-2xl font-bold text-theme-medium">{pub.name.charAt(0)}</span>
                  )}
                </div>
                <h3 className="text-center font-bold text-theme-darkest group-hover:text-theme-medium transition-colors line-clamp-2">
                  {pub.name}
                </h3>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="books" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <button 
              onClick={() => setSelectedPublisher(null)}
              className="flex items-center gap-2 text-theme-medium hover:text-theme-darkest font-bold tracking-wider uppercase text-sm transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} /> Back to Publishers
            </button>

            {booksLoading ? (
              <div className="text-center py-20 text-theme-medium">Loading books...</div>
            ) : publisherBooks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                {publisherBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-theme-light/30">
                <p className="text-theme-medium">No books found for this publisher yet.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
