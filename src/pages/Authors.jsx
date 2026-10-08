import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import BookCard from '../components/BookCard';

export default function Authors() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personBooks, setPersonBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);

  useEffect(() => {
    const fetchAuthorsAndTranslators = async () => {
      const [authorsRes, translatorsRes] = await Promise.all([
        supabase.from('authors').select('*').order('name_en'),
        supabase.from('translators').select('*').order('name_en')
      ]);
      
      let combined = [];
      if (authorsRes.data) {
        combined = [...combined, ...authorsRes.data.map(a => ({ ...a, role: 'Author' }))];
      }
      if (translatorsRes.data) {
        combined = [...combined, ...translatorsRes.data.map(t => ({ ...t, role: 'Translator' }))];
      }
      
      setAuthors(combined.sort((a, b) => a.name_en.localeCompare(b.name_en)));
      setLoading(false);
    };
    fetchAuthorsAndTranslators();
  }, []);

  const handlePersonClick = async (person) => {
    setSelectedPerson(person);
    setBooksLoading(true);
    const { data } = await supabase
      .from('books')
      .select('*')
      .or(`author.eq."${person.name_en}",translator.eq."${person.name_en}"`)
      .order('created_at', { ascending: false });
    if (data) setPersonBooks(data);
    setBooksLoading(false);
  };

  if (loading) {
    return (
      <div className="w-full text-center py-32 bg-theme-bg/60 backdrop-blur-lg rounded-2xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] border border-theme-light/30 mt-8">
        <div className="w-12 h-12 border-4 border-theme-medium border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-theme-medium font-medium">Loading authors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in relative z-10">
      {/* HEADER */}
      <div className="w-full text-center py-16 bg-theme-bg/60 backdrop-blur-lg rounded-2xl border border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <h2 className="text-4xl font-serif font-bold text-theme-darkest mb-4 drop-shadow-sm">
          {selectedPerson ? `Books by ${selectedPerson.name_en}` : 'Authors & Translators'}
        </h2>
        <p className="text-theme-darkest/70 font-medium">
          {selectedPerson 
            ? `Explore the complete collection of works by ${selectedPerson.name_en}.` 
            : "Discover the brilliant minds behind your favorite stories."}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedPerson ? (
          <motion.div key="grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {authors.map(person => (
              <div 
                key={person.id} 
                onClick={() => handlePersonClick(person)}
                className="bg-slate-50 rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:-translate-y-2 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-28 h-28 relative overflow-hidden rounded-full bg-theme-light/50 flex items-center justify-center border-4 border-white shadow-inner group-hover:border-theme-light transition-colors">
                  <span className="text-5xl font-bold text-theme-deep">{person.name_en.charAt(0).toUpperCase()}</span>
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg text-theme-darkest group-hover:text-theme-medium transition-colors line-clamp-2">
                    {person.name_en}
                  </h3>
                  <p className="text-sm text-slate-500 font-semibold mb-2">
                    {person.name_si}
                  </p>
                  <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${
                    person.role === 'Author' ? 'bg-theme-medium text-theme-bg' : 'bg-theme-light text-theme-darkest'
                  }`}>
                    {person.role}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="books" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <button 
              onClick={() => setSelectedPerson(null)}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md px-6 py-2 rounded-full text-theme-darkest font-bold tracking-wider uppercase text-sm transition-all cursor-pointer hover:bg-white w-max"
            >
              <ChevronLeft size={18} /> Back to Directory
            </button>

            {booksLoading ? (
              <div className="text-center py-20 text-theme-darkest/70 font-medium bg-white/40 backdrop-blur-md rounded-2xl border border-white/30">Loading books...</div>
            ) : personBooks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {personBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-theme-darkest/70 font-medium text-lg">No books found for this {selectedPerson.role.toLowerCase()} yet.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
