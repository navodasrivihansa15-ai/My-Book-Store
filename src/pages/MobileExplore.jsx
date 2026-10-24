import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, PenTool, ChevronRight } from 'lucide-react'; 
import { supabase } from '../lib/supabase';

export default function MobileExplorePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('AUTHORS'); // 'AUTHORS' or 'TRANSLATORS'
  const [searchQuery, setSearchQuery] = useState('');
  const [authors, setAuthors] = useState([]);
  const [translators, setTranslators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Data - Map this to your actual Supabase tables
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // TEMPORARY FALLBACK DATA (Used if no data in database)
        const dummyAuthors = [
          { id: 1, name: 'Martin Wickramasinghe', bookCount: 15 },
          { id: 2, name: 'Arthur C. Clarke', bookCount: 8 },
          { id: 3, name: 'Ediriweera Sarachchandra', bookCount: 5 }
        ];
        const dummyTranslators = [
          { id: 1, name: 'Ganga Niroshani', bookCount: 12 },
          { id: 2, name: 'K.G. Karunathilake', bookCount: 20 }
        ];

        // Fetch contributors and books from Supabase
        const [contributorsRes, booksRes] = await Promise.all([
          supabase.from('contributors').select('*').order('name_en'),
          supabase.from('books').select('author, translator')
        ]);

        const authorCounts = {};
        const translatorCounts = {};

        if (booksRes.data) {
          booksRes.data.forEach((b) => {
            if (b.author) authorCounts[b.author] = (authorCounts[b.author] || 0) + 1;
            if (b.translator) translatorCounts[b.translator] = (translatorCounts[b.translator] || 0) + 1;
          });
        }

        const authorsList = [];
        const translatorsList = [];

        if (contributorsRes.data && contributorsRes.data.length > 0) {
          contributorsRes.data.forEach((c) => {
            const name = c.name_en || c.name;
            if (!name) return;
            const isAuthor = !c.role || c.role === 'AUTHOR' || c.role === 'BOTH';
            const isTranslator = c.role === 'TRANSLATOR' || c.role === 'BOTH';

            if (isAuthor) {
              authorsList.push({
                id: c.id,
                name: name,
                bookCount: authorCounts[name] || 0
              });
            }
            if (isTranslator) {
              translatorsList.push({
                id: c.id,
                name: name,
                bookCount: translatorCounts[name] || 0
              });
            }
          });
        }

        // Also add any authors/translators from books if not already in list
        if (booksRes.data) {
          const authorNamesSet = new Set(authorsList.map((a) => a.name.toLowerCase()));
          const translatorNamesSet = new Set(translatorsList.map((t) => t.name.toLowerCase()));

          Object.entries(authorCounts).forEach(([name, count]) => {
            if (name && !authorNamesSet.has(name.toLowerCase())) {
              authorsList.push({ id: `author-${name}`, name, bookCount: count });
              authorNamesSet.add(name.toLowerCase());
            }
          });

          Object.entries(translatorCounts).forEach(([name, count]) => {
            if (name && !translatorNamesSet.has(name.toLowerCase())) {
              translatorsList.push({ id: `translator-${name}`, name, bookCount: count });
              translatorNamesSet.add(name.toLowerCase());
            }
          });
        }

        setAuthors(authorsList.length > 0 ? authorsList : dummyAuthors);
        setTranslators(translatorsList.length > 0 ? translatorsList : dummyTranslators);
      } catch (error) {
        console.error("Error fetching explore data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter based on search and active tab
  const currentList = activeTab === 'AUTHORS' ? authors : translators;
  const filteredList = currentList.filter(person => 
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:hidden">
      {/* HEADER SECTION */}
      <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Explore</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400"/>
          </div>
          <input
            type="text"
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
          />
        </div>

        {/* TABS */}
        <div className="flex mt-4 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('AUTHORS')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
              activeTab === 'AUTHORS' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4"/>
            Authors
          </button>
          <button
            onClick={() => setActiveTab('TRANSLATORS')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
              activeTab === 'TRANSLATORS' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <PenTool className="w-4 h-4"/>
            Translators
          </button>
        </div>
      </div>

      {/* LIST SECTION - Added pb-24 to ensure it scrolls above the bottom nav bar */}
      <div className="flex-1 px-4 py-4 overflow-y-auto pb-24">
        {isLoading ? (
          // Skeleton Loader
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-200 animate-pulse h-16 rounded-xl w-full"></div>
            ))}
          </div>
        ) : filteredList.length > 0 ? (
          <div className="space-y-3">
            {filteredList.map((person) => (
              <div 
                key={person.id}
                onClick={() => navigate(activeTab === 'AUTHORS' ? `/author/${encodeURIComponent(person.name)}` : `/translator/${encodeURIComponent(person.name)}`)}
                className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex items-center justify-between active:scale-[0.98] active:bg-gray-50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${activeTab === 'AUTHORS' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{person.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {person.bookCount ? `${person.bookCount} Books` : 'View Collection'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400"/>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">No {activeTab.toLowerCase()} found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
