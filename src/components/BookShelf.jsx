import { Link } from 'react-router-dom';
import BookCard from './BookCard';
import { useCart } from '../context/CartContext';

export default function BookShelf({ title, books, viewAllLink }) {
  const { addToCart } = useCart();
  
  if (!books || books.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-end border-b border-theme-medium/20 pb-2">
        <h3 className="text-xl font-bold text-theme-darkest">{title}</h3>
        <Link 
          to={viewAllLink}
          className="text-theme-medium hover:underline text-sm font-medium cursor-pointer"
        >
          View All
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
        {books.slice(0, 5).map(book => (
          <div key={book.id} className="w-full flex justify-center">
            <BookCard book={book} addToCart={addToCart} />
          </div>
        ))}
      </div>
    </div>
  );
}
