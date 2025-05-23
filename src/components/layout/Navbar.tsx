import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'text-green-600 font-medium' : 'text-gray-700 hover:text-green-600';
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-green-600">🚮 Garbage Watch</span>
            </Link>
            
            {/* Desktop menu */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/" className={`inline-flex items-center px-1 pt-1 border-b-2 ${location.pathname === '/' ? 'border-green-500' : 'border-transparent'} ${isActive('/')}`}>
                Home
              </Link>
              <Link to="/report" className={`inline-flex items-center px-1 pt-1 border-b-2 ${location.pathname === '/report' ? 'border-green-500' : 'border-transparent'} ${isActive('/report')}`}>
                Report
              </Link>
              <Link to="/map" className={`inline-flex items-center px-1 pt-1 border-b-2 ${location.pathname === '/map' ? 'border-green-500' : 'border-transparent'} ${isActive('/map')}`}>
                Map
              </Link>
              <Link to="/gallery" className={`inline-flex items-center px-1 pt-1 border-b-2 ${location.pathname === '/gallery' ? 'border-green-500' : 'border-transparent'} ${isActive('/gallery')}`}>
                Gallery
              </Link>
              <Link to="/track" className={`inline-flex items-center px-1 pt-1 border-b-2 ${location.pathname === '/track' ? 'border-green-500' : 'border-transparent'} ${isActive('/track')}`}>
                Track
              </Link>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            <Link to="/" className={`block pl-3 pr-4 py-2 ${location.pathname === '/' ? 'bg-green-50 border-l-4 border-green-500 text-green-700' : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}>
              Home
            </Link>
            <Link to="/report" className={`block pl-3 pr-4 py-2 ${location.pathname === '/report' ? 'bg-green-50 border-l-4 border-green-500 text-green-700' : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}>
              Report
            </Link>
            <Link to="/map" className={`block pl-3 pr-4 py-2 ${location.pathname === '/map' ? 'bg-green-50 border-l-4 border-green-500 text-green-700' : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}>
              Map
            </Link>
            <Link to="/gallery" className={`block pl-3 pr-4 py-2 ${location.pathname === '/gallery' ? 'bg-green-50 border-l-4 border-green-500 text-green-700' : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}>
              Gallery
            </Link>
            <Link to="/track" className={`block pl-3 pr-4 py-2 ${location.pathname === '/track' ? 'bg-green-50 border-l-4 border-green-500 text-green-700' : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}`}>
              Track
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 