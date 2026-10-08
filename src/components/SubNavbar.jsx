import { NavLink } from 'react-router-dom';

export default function SubNavbar() {
  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'All Books', path: '/books' },
    { name: 'PUBLISHERS', path: '/publishers' },
    { name: 'Authors', path: '/authors' },
    { name: 'Offers', path: '/offers' },
  ];

  return (
    <div className="hidden md:block fixed w-full z-40 top-20 bg-theme-deep/70 backdrop-blur-xl border-b border-white/10 shadow-lg text-theme-bg">
      <div className="w-[96%] max-w-[1440px] mx-auto px-2 md:px-4">
        <ul className="flex items-center gap-8 overflow-x-auto custom-scrollbar">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `block py-3 text-sm font-semibold tracking-wide whitespace-nowrap transition-colors relative ${
                    isActive 
                      ? 'text-theme-light' 
                      : 'text-theme-bg/80 hover:text-theme-light'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-theme-light" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
