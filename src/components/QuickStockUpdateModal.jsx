import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logStaffAction } from '../utils/staffActivityTracker';

export default function QuickStockUpdateModal({ book, isOpen, onClose, onUpdated, currentUser }) {
  const currentStock = Number(book?.stock ?? book?.quantity_in_stock ?? 0);
  const currentSellingPrice = Number(book?.price ?? book?.selling_price ?? 0);
  const currentOriginalPrice = Number(book?.original_price ?? book?.mrp ?? currentSellingPrice);

  const [addedStock, setAddedStock] = useState('');
  const [originalPrice, setOriginalPrice] = useState(currentOriginalPrice);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(currentSellingPrice);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (book) {
      const sp = Number(book.price ?? book.selling_price ?? 0);
      const op = Number(book.original_price ?? book.mrp ?? sp);
      setAddedStock('');
      setSellingPrice(sp);
      setOriginalPrice(op);

      if (op > sp && op > 0) {
        setDiscountPercent(Math.round(((op - sp) / op) * 100));
      } else {
        setDiscountPercent(0);
      }
    }
  }, [book]);

  if (!isOpen || !book) return null;

  const finalStock = currentStock + Number(addedStock || 0);

  // Auto-calculate Selling Price when Discount % changes
  const handleDiscountChange = (val) => {
    const disc = Math.max(0, Math.min(99, Number(val || 0)));
    setDiscountPercent(disc);
    const base = Number(originalPrice || 0);
    if (base > 0) {
      const calculated = Math.round(base - (base * disc) / 100);
      setSellingPrice(calculated);
    }
  };

  // Auto-calculate Selling Price when Original Price (MRP) changes
  const handleOriginalPriceChange = (val) => {
    setOriginalPrice(val);
    const base = Number(val || 0);
    const disc = Number(discountPercent || 0);
    if (base > 0 && disc > 0) {
      setSellingPrice(Math.round(base - (base * disc) / 100));
    } else if (disc === 0) {
      setSellingPrice(base);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedPayload = {
        stock: Math.max(0, finalStock),
        price: Number(sellingPrice),
        original_price: Number(originalPrice) > Number(sellingPrice) ? Number(originalPrice) : Number(sellingPrice)
      };

      const { data, error } = await supabase
        .from('books')
        .update(updatedPayload)
        .eq('id', book.id)
        .select()
        .single();

      if (error) throw error;

      logStaffAction(
        'STOCK_UPDATED',
        `Scanner Stock/Price Update for "${book.title}": Stock ${currentStock} → ${updatedPayload.stock}, Price Rs.${updatedPayload.price}`,
        {
          bookId: book.id,
          barcode: book.barcode || book.isbn,
          oldStock: currentStock,
          newStock: updatedPayload.stock,
          newPrice: updatedPayload.price
        },
        currentUser
      );

      if (typeof onUpdated === 'function') onUpdated(data || { ...book, ...updatedPayload });
      onClose();
    } catch (err) {
      console.error('Failed to update stock/price:', err);
      alert('Failed to update book stock: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
              ✅ Found in Inventory
            </span>
            <h3 className="text-base font-black text-slate-900 mt-1">
              Update Stock, Price & Discount
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Book Summary Card */}
        <div className="flex items-center gap-3.5 bg-blue-50/60 border border-blue-100 p-3 rounded-2xl mb-4">
          {(book.cover_image_url || book.cover_url || book.image_url) ? (
            <img
              src={book.cover_image_url || book.cover_url || book.image_url}
              alt={book.title}
              className="w-12 h-16 object-cover rounded-xl border border-white shadow-xs shrink-0"
            />
          ) : (
            <div className="w-12 h-16 bg-blue-600 text-white font-black flex items-center justify-center rounded-xl text-lg shrink-0">
              📚
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-slate-900 text-sm truncate">{book.title}</h4>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Barcode: <span className="font-bold text-slate-700">{book.barcode || book.isbn}</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-white text-blue-700 border border-blue-200">
                Current Stock: {currentStock}
              </span>
              <span className="text-[11px] font-extrabold text-slate-700">
                Rs. {currentSellingPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* 1. STOCK UPDATE SECTION */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <label className="font-extrabold text-slate-700">📦 Add New Stock Quantity</label>
              <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                New Total: {finalStock}
              </span>
            </div>

            <input
              type="number"
              placeholder="Enter quantity to add (e.g. 10)"
              value={addedStock}
              onChange={(e) => setAddedStock(e.target.value)}
              autoFocus
              className="w-full p-3 bg-white border-2 border-blue-200 focus:border-blue-600 rounded-xl font-black text-sm text-slate-900 focus:outline-none"
            />

            {/* Quick Increment Pills */}
            <div className="flex items-center gap-2 mt-2.5">
              {[1, 5, 10, 20, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setAddedStock((prev) => String(Number(prev || 0) + num))}
                  className="flex-1 py-1.5 bg-white hover:bg-blue-50 active:scale-95 border border-slate-200 rounded-lg font-extrabold text-blue-600 text-[11px] transition cursor-pointer"
                >
                  +{num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAddedStock('0')}
                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-[11px] cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* 2. PRICE & DISCOUNT UPDATE SECTION */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
            <p className="font-extrabold text-slate-700">🏷️ Price & Discount Options (Optional)</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Original Price (MRP)</label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => handleOriginalPriceChange(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={discountPercent}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Final Selling Price (Rs.) *
              </label>
              <input
                type="number"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full p-3 bg-white border-2 border-blue-500 rounded-xl font-black text-base text-blue-600"
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl shadow-md active:scale-95 transition cursor-pointer"
            >
              {saving ? 'Updating...' : '💾 Update Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
