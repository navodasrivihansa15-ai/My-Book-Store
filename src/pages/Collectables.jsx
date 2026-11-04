import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Adjust path if needed
import { triggerBuyNowModal } from '../components/GlobalBuyNowModal'; // Adjust path if needed

const CATEGORIES = [
  'All',
  'Bookmarks',
  'Mugs & Drinkware',
  'Reading Lights',
  'Book Sleeves & Totes',
  'Stationery & Journals',
  'Stickers & Pins',
  'Gift Boxes & Merch'
];

export default function Collectables({ onAddToCart }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [settingRes, itemsRes] = await Promise.all([
          supabase
            .from('store_settings')
            .select('setting_value')
            .eq('setting_key', 'show_collectables_page')
            .maybeSingle(),
          supabase
            .from('collectables')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
        ]);

        if (settingRes.data && settingRes.data.setting_value === false) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }

        if (itemsRes.data) setItems(itemsRes.data);
      } catch (err) {
        console.error('Error loading collectables storefront:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Adapter: Makes a Collectable item 100% compatible with the Book Cart, Checkout & Buy Now Modal
  const normalizeForUnifiedCart = (item) => ({
    ...item,
    is_collectable: true,
    item_type: 'COLLECTABLE',
    name: item.title,
    author: item.category || 'Reader Collectable',
    selling_price: Number(item.price || 0),
    cover_url: item.image_url || '',
    image: item.image_url || '',
    quantity_in_stock: Number(item.stock ?? 0)
  });

  const handleAddToCartClick = (e, rawItem) => {
    e.preventDefault();
    e.stopPropagation();
    const unifiedItem = normalizeForUnifiedCart(rawItem);

    if (typeof onAddToCart === 'function') {
      onAddToCart(unifiedItem);
      return;
    }

    // Fallback direct cart storage so Books + Collectables combine into a single bill
    try {
      const rawCart = localStorage.getItem('cart');
      const currentCart = rawCart ? JSON.parse(rawCart) : [];
      const existingIdx = currentCart.findIndex((i) => i.id === unifiedItem.id);
      if (existingIdx >= 0) {
        currentCart[existingIdx].quantity = (currentCart[existingIdx].quantity || 1) + 1;
      } else {
        currentCart.push({ ...unifiedItem, quantity: 1 });
      }
      localStorage.setItem('cart', JSON.stringify(currentCart));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (err) {
      console.error('Unified cart error:', err);
    }
  };

  if (!loading && !isVisible) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4">
          🎁
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Reader Collectables Coming Soon!</h1>
        <p className="text-sm text-gray-500 max-w-md mt-2">
          We are preparing our collection of aesthetic bookmarks, reading lights, mugs, and bookish accessories.
        </p>
      </div>
    );
  }

  const filtered = items.filter((item) => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
      {/* BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-lg mb-6">
        <span className="text-[11px] font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
          Alexandria Reader Accessories
        </span>
        <h1 className="text-2xl md:text-4xl font-black mt-3">Reader Collectables</h1>
        <p className="text-xs md:text-sm text-blue-100 mt-1.5 max-w-2xl">
          Add aesthetic bookmarks, reading lights, mugs, and book sleeves straight to your book cart in a single bill!
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search collectables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-64 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* GRID */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 font-bold text-sm animate-pulse">
          Loading Collectables...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((item) => {
            const outOfStock = Number(item.stock ?? 0) <= 0;
            const unifiedItem = normalizeForUnifiedCart(item);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-3 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/5] w-full bg-gray-50 rounded-xl overflow-hidden mb-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl bg-blue-50 text-blue-500">
                        🎁
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                  )}

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-sm sm:text-base font-extrabold text-blue-600">
                      Rs. {Number(item.price || 0).toLocaleString()}
                    </span>
                    {item.original_price && Number(item.original_price) > Number(item.price) && (
                      <span className="text-[11px] text-gray-400 line-through">
                        Rs. {Number(item.original_price).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2-LINE BLUE THEME BUTTONS (ADD TO CART + BUY NOW) */}
                <div className="flex flex-col gap-2 mt-3 w-full">
                  <button
                    type="button"
                    disabled={outOfStock}
                    onClick={(e) => handleAddToCartClick(e, item)}
                    className="w-full py-2 px-3 border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50 font-bold rounded-xl text-xs transition"
                  >
                    {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </button>

                  <button
                    type="button"
                    disabled={outOfStock}
                    onClick={(e) => triggerBuyNowModal(e, unifiedItem)}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm text-xs transition"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full p-12 text-center text-gray-400 text-sm">
              No collectables found in this category.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
