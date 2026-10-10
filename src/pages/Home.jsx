import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { LayoutGrid, Search } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import BookCard from '../components/BookCard';
import BookShelf from '../components/BookShelf';

const fallbackImage = 'https://placehold.co/400x600/e2e8f0/0b1d3a?text=No+Cover';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [publishers, setPublishers] = useState([]);
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

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchParams(prev => {
      if (value) prev.set('search', value);
      else prev.delete('search');
      return prev;
    });
  };

  const fetchData = async () => {
    const { data: bookData } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    if (bookData) setBooks(bookData);
    
    const { data: catData } = await supabase.from('categories').select('*').order('name');
    if (catData) setCategories(catData.map(c => c.name));
    
    const { data: contData } = await supabase.from('contributors').select('*');
    if (contData) setContributors(contData);

    const { data: pubData } = await supabase.from('publishers').select('*');
    if (pubData) setPublishers(pubData);

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
      const q = searchQuery.toLowerCase();
      result = result.filter(book => 
        (book.title && book.title.toLowerCase().includes(q)) || 
        (book.isbn && book.isbn.toLowerCase().includes(q)) || 
        (book.author && book.author.toLowerCase().includes(q)) || 
        (book.translator && book.translator.toLowerCase().includes(q)) ||
        (book.publisher && book.publisher.toLowerCase().includes(q))
      );
    }
    
    return result;
  }, [books, bestSellers, searchQuery, selectedCategory]);

  const filteredContributors = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return contributors.filter(c => 
      (c.name_en && c.name_en.toLowerCase().includes(q)) || 
      (c.name_si && c.name_si.toLowerCase().includes(q))
    );
  }, [contributors, searchQuery]);

  const filteredPublishers = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return publishers.filter(p => 
      (p.name && p.name.toLowerCase().includes(q))
    );
  }, [publishers, searchQuery]);

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
        {/* Mobile Search Bar */}
        <div className="w-[95%] mx-auto mt-0 mb-3 block md:hidden relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-darkest/50 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search books, authors, ISBN..." 
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-theme-medium transition-all text-sm text-theme-darkest placeholder-theme-darkest/50 shadow-inner"
          />
        </div>



        {(!searchQuery && (!selectedCategory || selectedCategory === 'All')) && (
          <>
            <HeroBanner className="w-full aspect-[3/2] md:aspect-[16/5] object-cover rounded-2xl shadow-md mb-12" />
            <div className="flex flex-col gap-6 md:gap-12 mb-8 md:mb-20">
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
          <div id="collection" className="mb-8 md:mb-16">
            <div className="flex justify-between items-center mb-4 md:mb-8 border-b border-theme-medium/20 pb-4">
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

            {searchQuery && (filteredContributors.length > 0 || filteredPublishers.length > 0) && (
              <div className="space-y-8 mb-12">
                {filteredContributors.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-theme-darkest mb-4 border-b border-theme-medium/20 pb-2">Authors & Translators</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                      {filteredContributors.map(person => (
                        <Link 
                          to={`/${person.role === 'Translator' ? 'translator' : 'author'}/${encodeURIComponent(person.name_en)}`}
                          key={person.id} 
                          className="bg-slate-50 rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:-translate-y-2 hover:shadow-lg transition-all duration-300 group text-center"
                        >
                          <div className="w-20 h-20 relative overflow-hidden rounded-full bg-theme-light/50 flex items-center justify-center border-4 border-white shadow-inner group-hover:border-theme-light transition-colors">
                            <span className="text-3xl font-bold text-theme-deep">{person.name_en.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-theme-darkest group-hover:text-theme-medium transition-colors line-clamp-2">
                              {person.name_en}
                            </h3>
                            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm bg-theme-medium/10 text-theme-darkest">
                              {person.role}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {filteredPublishers.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-theme-darkest mb-4 border-b border-theme-medium/20 pb-2">Publishers</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                      {filteredPublishers.map(pub => (
                        <Link 
                          to={`/publishers/${encodeURIComponent(pub.name)}`}
                          key={pub.id} 
                          className="bg-slate-50 rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:-translate-y-2 hover:shadow-lg transition-all duration-300 group text-center"
                        >
                          <div className="w-20 h-20 relative overflow-hidden rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-inner group-hover:border-slate-300 transition-colors">
                            <span className="text-3xl font-bold text-slate-700">{pub.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-theme-darkest group-hover:text-theme-medium transition-colors line-clamp-2">
                              {pub.name}
                            </h3>
                            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm bg-slate-200 text-slate-700">
                              Publisher
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {filteredBooks.length > 0 ? (
              <div>
                {searchQuery && <h3 className="text-xl font-bold text-theme-darkest mb-4 border-b border-theme-medium/20 pb-2">Books</h3>}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
                  {filteredBooks.map(book => (
                    <div key={book.id} className="w-full flex justify-center">
                      <BookCard book={book} addToCart={addToCart} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              (!searchQuery || (filteredContributors.length === 0 && filteredPublishers.length === 0)) && (
                <div className="text-center py-24 bg-white rounded-2xl border border-theme-light/30 shadow-md">
                  <p className="text-theme-darkest/70 font-medium text-xl mb-6">No matching results found for your search.</p>
                  <button 
                    onClick={() => { setSearchParams({}) }}
                    className="bg-theme-deep text-theme-bg px-8 py-3 rounded-full font-bold tracking-wide text-sm hover:bg-theme-darkest transition-all cursor-pointer shadow-md hover:shadow-lg hover:shadow-theme-medium/20"
                  >
                    Clear Search
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}
