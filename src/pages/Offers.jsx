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
    <div className="w-full mt-4">
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-brand-blue font-serif mb-2">Special Offers</h2>
        <p className="text-slate-500 font-medium">Exclusive deals and discounts for our readers.</p>
      </div>

      {!loading && offerBanners.length > 0 && (
        <div className="mb-12">
          <HeroBanner banners={offerBanners} disableLinks={true} />
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-medium animate-pulse">Loading offers...</div>
      ) : offerBooks.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8 mb-16">
          {offerBooks.map(book => (
            <div key={book.id} className="w-full flex justify-center min-w-[220px] max-w-[280px] mx-auto md:max-w-none">
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
