import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Menu, X } from 'lucide-react';
import LoginModal from '@/components/auth/LoginModal';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, logout, isLoading } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const isActive = (path: string) => {
    return location === path ? 'text-primary' : 'text-gray-600 hover:text-primary';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-primary font-bold text-xl">The Resource Consultants</Link>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className={`${isActive('/')} px-3 py-2 text-sm font-medium`}>
              Job Listings
            </Link>
            
            {(user && user.role === 'employee') || user?.role === 'admin' ? (
              <Link 
                href="/employee" 
                className={`${isActive('/employee')} px-3 py-2 text-sm font-medium`}>
                Employee Portal
              </Link>
            ) : null}
            
            {user?.role === 'admin' && (
              <Link 
                href="/admin" 
                className={`${isActive('/admin')} px-3 py-2 text-sm font-medium`}>
                Admin Portal
              </Link>
            )}
          </nav>
          
          {/* User Menu */}
          <div className="flex items-center">
            {isLoading ? (
              <div className="w-20 h-8 bg-gray-200 animate-pulse rounded-md"></div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <p className="text-gray-700 hidden md:block">
                  Hello, {user.preferredName || user.firstName || user.fullName.split(' ')[0]}
                </p>
                <Button variant="outline" onClick={logout} className="md:mr-4">
                  Log out
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowLoginModal(true)} className="md:mr-4">
                Log in
              </Button>
            )}
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden bg-white p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200">
          {user && (
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-gray-700 font-medium">Hello, {user.preferredName || user.firstName || user.fullName.split(' ')[0]}</p>
            </div>
          )}
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              href="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
              onClick={toggleMenu}
            >
              Job Listings
            </Link>
            
            {(user && user.role === 'employee') || user?.role === 'admin' ? (
              <Link 
                href="/employee" 
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                onClick={toggleMenu}
              >
                Employee Portal
              </Link>
            ) : null}
            
            {user?.role === 'admin' && (
              <Link 
                href="/admin" 
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                onClick={toggleMenu}
              >
                Admin Portal
              </Link>
            )}
          </div>
        </div>
      )}
      
      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </header>
  );
};

export default Navbar;
