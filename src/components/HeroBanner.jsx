import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroBanner({ banners: externalBanners = null, disableLinks = false }) {
  const [internalBanners, setInternalBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(!externalBanners);
  const [isHovered, setIsHovered] = useState(false);

  const banners = externalBanners || internalBanners;

  useEffect(() => {
    if (externalBanners) {
      setLoading(false);
      return;
    }
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
          
        if (data && !error) {
          setInternalBanners(data);
        }
      } catch (err) {
        console.error('Error fetching banners:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
    
    let channel;
    try {
      channel = supabase.channel('public:banners')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, fetchBanners)
        .subscribe();
    } catch (e) {
      // Ignore if table doesn't exist yet
    }
      
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [externalBanners]);

  useEffect(() => {
    // Stop autoplay if hovered or only 1 banner exists
    if (banners.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, isHovered]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  const handleDotClick = (index) => setCurrentIndex(index);

  if (loading) {
    return (
      <div className="w-full h-[40vh] md:h-[60vh] max-w-7xl mx-auto rounded-2xl bg-gray-200 animate-pulse flex items-center justify-center mb-12 shadow-sm">
        <span className="text-gray-400 font-bold tracking-widest uppercase text-sm">Loading Advertisements...</span>
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <div 
      className="relative w-full h-[40vh] md:h-[60vh] max-w-7xl mx-auto rounded-2xl overflow-hidden bg-brand-blue group mb-12 shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          {(!disableLinks && banners[currentIndex].link_url) ? (
            <a href={banners[currentIndex].link_url} className="block w-full h-full cursor-pointer">
              <img 
                src={banners[currentIndex].mobile_image_url || banners[currentIndex].desktop_image_url || banners[currentIndex].image_url} 
                alt={banners[currentIndex].title || 'Mobile Advertisement'} 
                className="block md:hidden w-full h-full object-cover" 
              />
              <img 
                src={banners[currentIndex].desktop_image_url || banners[currentIndex].image_url} 
                alt={banners[currentIndex].title || 'Desktop Advertisement'} 
                className="hidden md:block w-full h-full object-cover" 
              />
            </a>
          ) : (
            <div className="w-full h-full">
              <img 
                src={banners[currentIndex].mobile_image_url || banners[currentIndex].desktop_image_url || banners[currentIndex].image_url} 
                alt={banners[currentIndex].title || 'Mobile Advertisement'} 
                className="block md:hidden w-full h-full object-cover" 
              />
              <img 
                src={banners[currentIndex].desktop_image_url || banners[currentIndex].image_url} 
                alt={banners[currentIndex].title || 'Desktop Advertisement'} 
                className="hidden md:block w-full h-full object-cover" 
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows (visible on hover) */}
      {banners.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-white/30 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-brand-gold cursor-pointer shadow-lg z-10"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-white/30 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-brand-gold cursor-pointer shadow-lg z-10"
          >
            <ChevronRight size={24} />
          </button>
          
          {/* Navigation Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDotClick(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer shadow-md ${
                  idx === currentIndex ? 'bg-brand-gold w-8' : 'bg-white/60 hover:bg-white'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
