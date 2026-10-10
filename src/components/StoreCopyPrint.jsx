import React from 'react';
import { formatPrice } from '../lib/utils';

export default function StoreCopyPrint({ order, storeSettings, storePrintSize }) {
  if (!order || !storePrintSize) return null;

  return (
    <div className="print-only-store-copy hidden-on-screen">
      <style>
        {`
          @media screen { 
            .print-only-store-copy { display: none !important; } 
          }
          @media print {
            body * { visibility: hidden; }
            .print-only-store-copy, .print-only-store-copy * { visibility: visible; }
            .print-only-store-copy {
              position: absolute; left: 0; top: 0;
              width: ${storePrintSize === 'A4' ? '210mm' : '148mm'};
              min-height: ${storePrintSize === 'A4' ? '297mm' : '210mm'};
              background: white; padding: 15mm;
              color: black;
              font-family: sans-serif;
            }
            @page { size: ${storePrintSize} portrait; margin: 0; }
          }
        `}
      </style>

      {/* Internal Print Content */}
      <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest">{storeSettings?.name || 'STORE NAME'}</h1>
          <p className="text-sm">{storeSettings?.address}</p>
          <p className="text-sm">{storeSettings?.phone}</p>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-black uppercase tracking-widest">STORE COPY</h2>
          <p className="font-bold text-lg">{order.display_id}</p>
          <p className="text-sm">{new Date(order.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="font-bold text-gray-800 border-2 border-gray-800 p-2 text-sm my-4 bg-gray-100 flex justify-between">
        <span>INTERNAL REF - HANDLED BY:</span>
        <span>{order.handled_by || 'N/A'}</span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 text-sm border border-gray-300 p-4">
        <div>
          <h3 className="font-bold uppercase border-b border-gray-300 mb-2">Customer Details</h3>
          <p><strong>Name:</strong> {order.customer_name || 'N/A'}</p>
          <p><strong>Phone:</strong> {order.phone || 'N/A'}</p>
          <p><strong>Email:</strong> {order.email || 'N/A'}</p>
          {order.address && <p><strong>Address:</strong> {order.address}, {order.city}</p>}
        </div>
        <div>
          <h3 className="font-bold uppercase border-b border-gray-300 mb-2">Order Info</h3>
          <p><strong>Status:</strong> {order.status}</p>
          <p><strong>Payment:</strong> {order.payment_status}</p>
          <p><strong>Method:</strong> {order.payment_method}</p>
        </div>
      </div>

      <table className="w-full text-left text-sm mb-6 border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-2">Item</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items?.map((item, index) => (
            <tr key={index} className="border-b border-gray-300">
              <td className="py-2">{item.books?.title || 'Unknown Item'}</td>
              <td className="py-2 text-center">{item.quantity}</td>
              <td className="py-2 text-right">{formatPrice(item.price)}</td>
              <td className="py-2 text-right">{formatPrice(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatPrice(order.total_amount - (order.delivery_fee || 0))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Delivery:</span>
            <span>{formatPrice(order.delivery_fee || 0)}</span>
          </div>
          <div className="flex justify-between font-black text-xl border-t-2 border-black pt-2">
            <span>TOTAL:</span>
            <span>{formatPrice(order.total_amount)}</span>
          </div>
        </div>
      </div>

      <div className="text-center text-xs mt-12 border-t border-gray-300 pt-4">
        This is an internal store copy. Not for customer distribution.
      </div>
    </div>
  );
}
