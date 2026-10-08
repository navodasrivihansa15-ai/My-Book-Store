import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import HeroBanner from '../components/HeroBanner';
import BookCard from '../components/BookCard';

export default function Offers() {
  const [offerBooks, setOfferBooks] = useState([]);
  const [offerBanners, setOfferBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      
      const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('is_offer', true)
        .order('created_at', { ascending: false });
        
      if (books) setOfferBooks(books);

      const { data: banners } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .eq('is_offer', true)
        .order('created_at', { ascending: false });
        
      if (banners) setOfferBanners(banners);

      setLoading(false);
    };

    fetchOffers();
  }, []);

  return (
    <div className="w-full min-h-screen pb-28 pt-24 md:pb-12 md:pt-32 px-3 md:px-8">
      <div className="mb-8">
        <h2 className="text-2xl md:text-4xl font-extrabold text-brand-blue font-serif mb-2 leading-tight">Special Offers</h2>
        <p className="text-slate-500 font-medium">Exclusive deals and discounts for our readers.</p>
      </div>

      {!loading && offerBanners.length > 0 && (
        <div className="w-full">
          <HeroBanner banners={offerBanners} disableLinks={true} className="w-full h-36 sm:h-48 md:h-64 mb-6" />
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-medium animate-pulse">Loading offers...</div>
      ) : offerBooks.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-6 mb-16">
          {offerBooks.map(book => (
            <div key={book.id} className="w-full flex justify-center mx-auto">
              <BookCard book={book} addToCart={addToCart} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-2xl border border-slate-100 shadow-sm mt-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">No Offers Currently Available</h2>
          <p className="text-slate-500 font-medium">Check back later for incredible deals.</p>
        </div>
      )}
    </div>
  );
}
