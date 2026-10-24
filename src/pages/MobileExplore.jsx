import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, PenTool, Building, ChevronRight } from 'lucide-react'; 
import { supabase } from '../lib/supabase';

export default function MobileExplorePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('AUTHORS'); // 'AUTHORS' | 'TRANSLATORS' | 'PUBLISHERS'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [authors, setAuthors] = useState([]);
  const [translators, setTranslators] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Data - Map this to your actual Supabase tables
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [contributorsRes, booksRes, publishersRes] = await Promise.all([
          supabase.from('contributors').select('*').order('name_en'),
          supabase.from('books').select('author, translator, publisher'),
          supabase.from('publishers').select('*').order('name')
        ]);

        const authorCounts = {};
        const translatorCounts = {};
        const publisherCounts = {};

        if (booksRes.data) {
          booksRes.data.forEach((b) => {
            if (b.author) authorCounts[b.author] = (authorCounts[b.author] || 0) + 1;
            if (b.translator) translatorCounts[b.translator] = (translatorCounts[b.translator] || 0) + 1;
            if (b.publisher) publisherCounts[b.publisher] = (publisherCounts[b.publisher] || 0) + 1;
          });
        }

        const authorsList = [];
        const translatorsList = [];
        const publishersList = [];

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

        if (publishersRes.data && publishersRes.data.length > 0) {
          publishersRes.data.forEach((p) => {
            if (!p.name) return;
            publishersList.push({
              id: p.id,
              name: p.name,
              bookCount: publisherCounts[p.name] || 0
            });
          });
        }

        // Also add any authors/translators/publishers from books if not already in list
        if (booksRes.data) {
          const authorNamesSet = new Set(authorsList.map((a) => a.name.toLowerCase()));
          const translatorNamesSet = new Set(translatorsList.map((t) => t.name.toLowerCase()));
          const publisherNamesSet = new Set(publishersList.map((p) => p.name.toLowerCase()));

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

          Object.entries(publisherCounts).forEach(([name, count]) => {
            if (name && !publisherNamesSet.has(name.toLowerCase())) {
              publishersList.push({ id: `publisher-${name}`, name, bookCount: count });
              publisherNamesSet.add(name.toLowerCase());
            }
          });
        }

        setAuthors(authorsList.length > 0 ? authorsList : [
          { id: 1, name: 'Martin Wickramasinghe', bookCount: 15 },
          { id: 2, name: 'Arthur C. Clarke', bookCount: 8 }
        ]);
        setTranslators(translatorsList.length > 0 ? translatorsList : [
          { id: 1, name: 'Ganga Niroshani', bookCount: 12 },
          { id: 2, name: 'K.G. Karunathilake', bookCount: 20 }
        ]);
        setPublishers(publishersList.length > 0 ? publishersList : [
          { id: 1, name: 'Sarasavi Publishers', bookCount: 150 },
          { id: 2, name: 'Samudra Book Shop', bookCount: 85 },
          { id: 3, name: 'M.D. Gunasena', bookCount: 300 }
        ]);
      } catch (error) {
        console.error("Error fetching explore data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter based on search and active tab
  const currentList = 
    activeTab === 'AUTHORS' ? authors : 
    activeTab === 'TRANSLATORS' ? translators : 
    publishers;

  const filteredList = currentList.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    // Uses 100dvh to perfectly fit the mobile screen (ignores browser address bar changes)
    <div className="flex flex-col bg-gray-50 md:hidden" style={{ height: '100dvh' }}>
      
      {/* FIXED HEADER SECTION */}
      <div className="bg-white px-4 pt-6 pb-3 shadow-sm shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Explore</h1>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400"/>
          </div>
          <input
            type="text"
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-100 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
          />
        </div>

        {/* 3-WAY TABS (Grid layout for equal width, stacked icon/text to fit mobile) */}
        <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('AUTHORS')}
            className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all ${
              activeTab === 'AUTHORS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-5 h-5 mb-1"/>
            <span className="text-[10px] font-bold tracking-wide">AUTHORS</span>
          </button>
          
          <button
            onClick={() => setActiveTab('TRANSLATORS')}
            className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all ${
              activeTab === 'TRANSLATORS' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <PenTool className="w-5 h-5 mb-1"/>
            <span className="text-[10px] font-bold tracking-wide">TRANSLATORS</span>
          </button>
          
          <button
            onClick={() => setActiveTab('PUBLISHERS')}
            className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all ${
              activeTab === 'PUBLISHERS' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building className="w-5 h-5 mb-1"/>
            <span className="text-[10px] font-bold tracking-wide">PUBLISHERS</span>
          </button>
        </div>
      </div>

      {/* SCROLLABLE LIST SECTION */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-200 animate-pulse h-16 rounded-xl w-full"></div>
            ))}
          </div>
        ) : filteredList.length > 0 ? (
          <div className="space-y-3">
            {filteredList.map((item) => (
              <div 
                key={item.id}
                onClick={() => navigate(
                  activeTab === 'AUTHORS' ? `/author/${encodeURIComponent(item.name)}` :
                  activeTab === 'TRANSLATORS' ? `/translator/${encodeURIComponent(item.name)}` :
                  `/publishers/${encodeURIComponent(item.name)}`
                )}
                className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex items-center justify-between active:scale-[0.98] active:bg-gray-50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${
                    activeTab === 'AUTHORS' ? 'bg-blue-500' : 
                    activeTab === 'TRANSLATORS' ? 'bg-purple-500' : 'bg-emerald-500'
                  }`}>
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.bookCount ? `${item.bookCount} Books` : 'View Collection'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0"/>
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
