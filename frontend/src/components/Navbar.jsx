import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Zap, LogOut, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-8 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="bg-yellow-400 p-2 rounded-xl">
          <Zap className="w-5 h-5 text-gray-900 fill-gray-900" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Live Lens</h1>
      </Link>

      <nav className="hidden md:flex items-center gap-8">
        <Link 
          to="/workplace" 
          className={`text-sm font-medium transition-colors ${isActive('/workplace') ? 'text-yellow-600' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Workplace
        </Link>
        <Link 
          to="/community" 
          className={`text-sm font-medium transition-colors ${isActive('/community') ? 'text-yellow-600' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Community Hub
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{user.username}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors group"
              title="Logout"
            >
              <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link 
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2"
            >
              Log in
            </Link>
            <Link 
              to="/register"
              className="text-sm font-medium bg-gray-900 text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors shadow-sm"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
