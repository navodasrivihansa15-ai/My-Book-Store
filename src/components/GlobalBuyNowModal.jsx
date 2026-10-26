import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

export default function GlobalBuyNowModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [buyQty, setBuyQty] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpen = (e) => {
      if (e.detail && e.detail.book) {
        setSelectedBook(e.detail.book);
        setBuyQty(1);
        setIsOpen(true);
      }
    };

    window.addEventListener('open-buy-now-modal', handleOpen);
    return () => window.removeEventListener('open-buy-now-modal', handleOpen);
  }, []);

  if (!isOpen || !selectedBook) return null;

  const unitPrice = Number(
    selectedBook.discount_percentage > 0 && selectedBook.sale_price
      ? selectedBook.sale_price
      : (selectedBook.price || selectedBook.selling_price || 0)
  );
  const maxStock = Number(selectedBook.stock || selectedBook.quantity_in_stock || 99);

  const handleConfirmDirectCheckout = () => {
    const directItem = {
      ...selectedBook,
      price: unitPrice,
      quantity: buyQty
    };
    // Store isolated direct-buy item without touching the regular cart
    sessionStorage.setItem('direct_buy_item', JSON.stringify(directItem));
    setIsOpen(false);
    navigate('/checkout?mode=direct');
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4"
      onClick={() => setIsOpen(false)}
    >
      {/* Modal Box: Bottom-sheet on Mobile (with extra bottom clearance for Bottom Nav), Centered Modal on Desktop */}
      <div 
        className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl p-6 pb-24 md:pb-6 shadow-2xl border-t md:border border-gray-100 animate-in slide-in-from-bottom-10 md:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Direct Purchase (Buy Now)</h3>
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 text-sm font-bold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Selected Book Preview */}
        <div className="flex items-center gap-3 mb-5 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
          {(selectedBook.cover_image_url || selectedBook.image || selectedBook.cover_url || selectedBook.image_url) && (
            <img 
              src={selectedBook.cover_image_url || selectedBook.image || selectedBook.cover_url || selectedBook.image_url} 
              alt={selectedBook.title || selectedBook.name} 
              className="w-12 h-16 object-cover rounded-lg shrink-0 border border-gray-200 bg-white"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-sm truncate">
              {selectedBook.title || selectedBook.name}
            </h4>
            <p className="text-blue-600 font-bold text-xs mt-0.5">
              Rs. {unitPrice.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
            </p>
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center justify-between mb-5 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <span className="text-gray-700 font-semibold text-sm">Select Quantity:</span>
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => setBuyQty((prev) => Math.max(1, prev - 1))}
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-xl text-blue-600 font-bold hover:bg-blue-50 active:scale-95 text-xl transition-all shadow-sm cursor-pointer"
            >
              -
            </button>
            <span className="font-bold text-lg w-8 text-center text-gray-900">{buyQty}</span>
            <button 
              type="button"
              onClick={() => setBuyQty((prev) => Math.min(maxStock, prev + 1))}
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-xl text-blue-600 font-bold hover:bg-blue-50 active:scale-95 text-xl transition-all shadow-sm cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Total Summary */}
        <div className="flex items-center justify-between mb-6 px-1">
          <span className="text-sm text-gray-500 font-medium">Total Direct Amount:</span>
          <span className="text-lg font-extrabold text-blue-600">
            Rs. {(unitPrice * buyQty).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Action Buttons (Blue Theme) */}
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleConfirmDirectCheckout}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm cursor-pointer"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Helper function to call from ANY button across the app
export const triggerBuyNowModal = (e, bookItem) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  window.dispatchEvent(new CustomEvent('open-buy-now-modal', { detail: { book: bookItem } }));
};
