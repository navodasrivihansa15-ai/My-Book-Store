import { createContext, useContext, useState } from 'react';

const CartContext = createContext({});

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (book) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === book.id);
      if (existing) {
        if (existing.quantity >= book.stock) {
          alert(`Only ${book.stock} copies available in stock`);
          return prev;
        }
        return prev.map(item => item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (book.stock < 1) {
        alert('This book is out of stock');
        return prev;
      }
      return [...prev, { ...book, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter(item => item.id !== id));
  };
  
  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setCart((prev) => {
      const item = prev.find(i => i.id === id);
      if (item && quantity > item.stock) {
        alert(`Only ${item.stock} copies available in stock`);
        return prev;
      }
      return prev.map(i => i.id === id ? { ...i, quantity } : i);
    });
  };
  
  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
