import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronRight } from 'lucide-react';

export default function MobileExplore() {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect to home if accessed on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        navigate('/');
      }
    };
    
    // Check initially
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [authorsRes, publishersRes] = await Promise.all([
          supabase.from('contributors').select('*').order('name_en').limit(6),
          supabase.from('publishers').select('*').order('name').limit(6)
        ]);

        if (authorsRes.data) setAuthors(authorsRes.data);
        if (publishersRes.data) setPublishers(publishersRes.data);
      } catch (error) {
        console.error("Error fetching explore data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="block md:hidden pb-24 pt-20 px-4 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-deep"></div>
      </div>
    );
  }

  return (
    <div className="block md:hidden pb-24 pt-24 min-h-screen bg-slate-50">
      
      {/* AUTHORS & TRANSLATORS SECTION */}
      <section className="mb-10">
        <div className="flex items-center justify-between px-5 mb-4">
          <h2 className="text-xl font-bold text-theme-deep tracking-tight">Authors & Translators</h2>
          <button 
            onClick={() => navigate('/authors')}
            className="text-theme-deep text-sm font-semibold flex items-center gap-1 hover:text-theme-medium transition-colors"
          >
            View All <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar space-x-4 py-2 px-5">
          {authors.map(author => (
            <div 
              key={author.id} 
              onClick={() => navigate(`/${author.is_translator ? 'translator' : 'author'}/${encodeURIComponent(author.name)}`)}
              className="flex flex-col items-center flex-shrink-0 w-24 cursor-pointer"
            >
              <div className="w-20 h-20 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center overflow-hidden mb-3">
                {author.image_url ? (
                  <img src={author.image_url} alt={author.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-gray-300">{author.name.charAt(0)}</span>
                )}
              </div>
              <span className="text-xs font-semibold text-center text-gray-700 line-clamp-2 leading-tight">
                {author.name}
              </span>
              {author.is_translator && (
                <span className="text-[10px] text-gray-400 mt-0.5">Translator</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* PUBLISHERS SECTION */}
      <section className="mb-6">
        <div className="flex items-center justify-between px-5 mb-4">
          <h2 className="text-xl font-bold text-theme-deep tracking-tight">Publishers</h2>
          <button 
            onClick={() => navigate('/publishers')}
            className="text-theme-deep text-sm font-semibold flex items-center gap-1 hover:text-theme-medium transition-colors"
          >
            View All <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar space-x-4 py-2 px-5">
          {publishers.map(publisher => (
            <div 
              key={publisher.id} 
              onClick={() => navigate(`/publishers/${encodeURIComponent(publisher.name)}`)}
              className="flex flex-col items-center flex-shrink-0 w-28 cursor-pointer"
            >
              <div className="w-24 h-24 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden mb-3 p-3">
                {publisher.logo_url ? (
                  <img src={publisher.logo_url} alt={publisher.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl font-bold text-gray-300">{publisher.name.charAt(0)}</span>
                )}
              </div>
              <span className="text-xs font-semibold text-center text-gray-700 line-clamp-2 leading-tight">
                {publisher.name}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
