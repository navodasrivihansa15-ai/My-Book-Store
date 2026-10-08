import { Link } from 'react-router-dom';

export default function MobileCategoryMenu({ isOpen, setIsOpen, categories }) {
  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-[9998] transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Menu Box */}
      <div 
        className={`fixed top-[75px] bottom-[85px] left-3 w-[85%] max-w-[320px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] z-[9999] flex flex-col overflow-hidden transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-[120%]'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
          <span className="font-bold text-lg text-theme-deep tracking-tight">Categories</span>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-1.5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain flex flex-col">
          {/* All Books */}
          <Link 
            to="/?category=All"
            onClick={() => setIsOpen(false)} 
            className="py-4 px-6 border-b border-gray-100 text-gray-800 font-bold hover:bg-gray-50"
          >
            All Books
          </Link>

          {/* Categories Rendering */}
          {!categories ? (
            <div className="p-6 text-gray-500 text-sm font-medium">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="p-6 text-gray-500 text-sm font-medium">No categories found.</div>
          ) : (
            categories.map((cat) => (
              <Link 
                key={cat.id || cat.name} 
                to={`/?category=${encodeURIComponent(cat.name)}`} 
                onClick={() => setIsOpen(false)}
                className="py-4 px-6 border-b border-gray-100 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                {cat.name}
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}
