import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { LayoutGrid } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import BookCard from '../components/BookCard';
import BookShelf from '../components/BookShelf';

const fallbackImage = 'https://placehold.co/400x600/e2e8f0/0b1d3a?text=No+Cover';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || 'All';

  const handleCategoryClick = (cat) => {
    setSearchParams(prev => {
      if (cat === 'All') prev.delete('category');
      else prev.set('category', cat);
      return prev;
    });
  };

  const fetchData = async () => {
    const { data: bookData } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    if (bookData) setBooks(bookData);
    
    const { data: catData } = await supabase.from('categories').select('*').order('name');
    if (catData) setCategories(catData.map(c => c.name));
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const channelBooks = supabase.channel('public:books').on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => fetchData()).subscribe();
    
    return () => { 
      supabase.removeChannel(channelBooks); 
    };
  }, []);

  const bestSellers = useMemo(() => [...books].sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0)), [books]);
  const newArrivals = useMemo(() => books.slice(0, 10), [books]);

  const filteredBooks = useMemo(() => {
    let result = books;
    if (selectedCategory === 'new-arrivals') {
      result = books;
    } else if (selectedCategory === 'best-sellers') {
      result = bestSellers;
    } else {
      result = books.filter(book => {
        if (book.is_offer && book.is_special) return false;
        const matchCategory = selectedCategory === 'All' || !selectedCategory || (book.categories && book.categories.includes(selectedCategory));
        return matchCategory;
      });
    }

    if (searchQuery) {
      result = result.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return result;
  }, [books, bestSellers, searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full">
      
      {/* LEFT SIDEBAR */}
      <aside className="hidden md:block w-64 flex-shrink-0 z-10">
        <div className="sticky top-40 bg-theme-bg/60 backdrop-blur-lg border-r border-theme-light/30 shadow-[4px_0_24px_rgba(0,0,0,0.02)] h-[calc(100vh-10rem)] overflow-y-auto scrollbar-hide p-6 rounded-2xl text-theme-darkest">
          <h3 className="font-bold tracking-tight mb-4 flex items-center gap-2">
            <LayoutGrid size={18} className="text-theme-medium" />
            Categories
          </h3>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => handleCategoryClick('All')}
              className={`text-left px-4 py-2.5 text-sm font-semibold hover:bg-theme-medium/20 hover:backdrop-blur-sm rounded-xl transition-all cursor-pointer ${
                selectedCategory === 'All' 
                  ? 'bg-theme-medium/20 backdrop-blur-sm text-theme-deep shadow-sm border border-theme-medium/20' 
                  : 'text-theme-darkest/70 hover:text-theme-deep border border-transparent'
              }`}
            >
              All Books
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`text-left px-4 py-2.5 text-sm font-semibold hover:bg-theme-medium/20 hover:backdrop-blur-sm rounded-xl transition-all cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-theme-medium/20 backdrop-blur-sm text-theme-deep shadow-sm border border-theme-medium/20' 
                    : 'text-theme-darkest/70 hover:text-theme-deep border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow min-w-0">
        {/* Mobile Categories (Horizontal Scroll) */}
        <div className="md:hidden flex overflow-x-auto whitespace-nowrap hide-scrollbar gap-2 mb-6 pb-2 -mx-2 px-2">
          <button
            onClick={() => handleCategoryClick('All')}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-all flex-shrink-0 ${
              selectedCategory === 'All' || !selectedCategory
                ? 'bg-theme-deep text-white shadow-md'
                : 'bg-white text-theme-darkest/70 border border-theme-light/30'
            }`}
          >
            All Books
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-all flex-shrink-0 ${
                selectedCategory === cat
                  ? 'bg-theme-deep text-white shadow-md'
                  : 'bg-white text-theme-darkest/70 border border-theme-light/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {(!searchQuery && (!selectedCategory || selectedCategory === 'All')) && (
          <>
            <HeroBanner />
            <div className="flex flex-col gap-12 mb-20">
              <BookShelf 
                title="New Arrivals" 
                books={books} 
                viewAllLink="/?category=new-arrivals" 
              />
              <BookShelf 
                title="Best Sellers" 
                books={bestSellers} 
                viewAllLink="/?category=best-sellers" 
              />
              {categories.map(category => {
                const categoryBooks = books.filter(book => book.categories && book.categories.includes(category));
                return (
                  <BookShelf 
                    key={category}
                    title={category}
                    books={categoryBooks}
                    viewAllLink={`/?category=${encodeURIComponent(category)}`}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* FULL COLLECTION & FILTERING */}
        {(searchQuery || (selectedCategory && selectedCategory !== 'All')) && (
          <div id="collection" className="mb-16">
            <div className="flex justify-between items-center mb-8 border-b border-theme-medium/20 pb-4">
              <h2 className="text-3xl font-bold text-theme-darkest tracking-tight">
                {selectedCategory === 'new-arrivals' ? 'New Arrivals' : 
                 selectedCategory === 'best-sellers' ? 'Best Sellers' : 
                 (selectedCategory && selectedCategory !== 'All') ? `${selectedCategory} Books` : 
                 (searchQuery ? `Search Results: "${searchQuery}"` : 'Discover')}
              </h2>
              <button 
                onClick={() => { setSearchParams({}) }}
                className="text-sm font-bold text-theme-medium hover:text-theme-deep transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>

            {filteredBooks.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
                {filteredBooks.map(book => (
                  <div key={book.id} className="w-full flex justify-center">
                    <BookCard book={book} addToCart={addToCart} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-2xl border border-theme-light/30 shadow-md">
                <p className="text-theme-darkest/70 font-medium text-xl mb-6">No masterpieces found matching your search.</p>
                <button 
                  onClick={() => { setSearchParams({}) }}
                  className="bg-theme-deep text-theme-bg px-8 py-3 rounded-full font-bold tracking-wide text-sm hover:bg-theme-darkest transition-all cursor-pointer shadow-md hover:shadow-lg hover:shadow-theme-medium/20"
                >
                  View All Books
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
