'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Car, Menu, X, LogOut, Sparkles, User, LayoutDashboard, Calendar, List, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToatsContext';

export function Navbar() {
  const { user, logout, isLoading, isTransitioning, setTransitioning } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTransitioning(true);
    showToast('Logging out...', 'info');
    
    setTimeout(() => {
      logout();
      setTransitioning(false);
      setIsLoggingOut(false);
      window.location.href = '/';
    }, 1000);
  };

  // Tampilkan skeleton saat loading, transisi, atau logout
  if (!mounted || isLoading || isTransitioning || isLoggingOut) {
    return (
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-gray-100 animate-pulse">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="bg-gray-200 p-2 rounded-full">
                <Car className="w-6 h-6 text-gray-300" />
              </div>
              <div>
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
                <div className="h-3 w-20 bg-gray-200 rounded mt-1"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
              <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isLoggedIn = !!user;

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white shadow-lg border-b border-gray-100' : 'bg-white border-b border-gray-100'}`}>
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-xl opacity-30 group-hover:opacity-50 transition"></div>
              <div className="relative bg-gradient-to-r from-[#D4AF37] to-[#C9A03D] p-2 rounded-full shadow-md">
                <Car className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <span className="font-bold text-2xl tracking-tight text-gray-900">
                CAR<span className="text-[#D4AF37]">RENTAL</span>
              </span>
              <p className="text-[10px] text-gray-400 tracking-wider">LUXURY FLEET</p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {/* Menu untuk yang belum login */}
            {!isLoggedIn && (
              <Link href="/cars" className="flex items-center gap-2 text-gray-600 hover:text-[#D4AF37] transition font-medium">
                <List className="w-4 h-4" />
                Car List
              </Link>
            )}

            {/* Menu untuk User Biasa (sudah login) */}
            {isLoggedIn && !isAdmin && (
              <>
                <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-[#D4AF37] transition font-medium">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link href="/my-rentals" className="flex items-center gap-2 text-gray-600 hover:text-[#D4AF37] transition font-medium">
                  <Calendar className="w-4 h-4" />
                  My Rentals
                </Link>
                <Link href="/payment-history" className="flex items-center gap-2 text-gray-600 hover:text-[#D4AF37] transition font-medium">
                  <CreditCard className="w-4 h-4" />
                  Payments
                </Link>
                <Link href="/cars" className="flex items-center gap-2 text-gray-600 hover:text-[#D4AF37] transition font-medium">
                  <List className="w-4 h-4" />
                  Car List
                </Link>
              </>
            )}

            {/* Menu untuk Admin */}
            {isLoggedIn && isAdmin && (
              <>
                <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-[#D4AF37] transition font-medium">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link href="/admin/manage-cars" className="flex items-center gap-2 text-gray-600 hover:text-[#D4AF37] transition font-medium">
                  <Car className="w-4 h-4" />
                  Manage Cars
                </Link>
                <Link href="/admin/all-rentals" className="flex items-center gap-2 text-gray-600 hover:text-[#D4AF37] transition font-medium">
                  <Calendar className="w-4 h-4" />
                  All Rentals
                </Link>
                <Link href="/admin/verify-payments" className="flex items-center gap-2 text-gray-600 hover:text-[#D4AF37] transition font-medium">
                  <CreditCard className="w-4 h-4" />
                  Verify Payments
                </Link>
              </>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-4 bg-gray-50 rounded-full px-5 py-2 border border-gray-200">
                <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">{user.name}</span>
                </Link>
                <div className="w-px h-6 bg-gray-200"></div>
                <button 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition text-sm disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <button className="text-gray-600 hover:text-[#D4AF37] transition font-medium">Sign In</button>
                </Link>
                <Link href="/register">
                  <button className="bg-gradient-to-r from-[#D4AF37] to-[#C9A03D] text-white font-semibold px-6 py-2 rounded-full hover:shadow-lg transition">
                    Join Now
                    <Sparkles className="w-4 h-4 ml-2 inline" />
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-gray-600">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div className="md:hidden py-6 border-t border-gray-100 bg-white">
            <div className="flex flex-col gap-4">
              {/* Menu untuk yang belum login */}
              {!isLoggedIn && (
                <Link href="/cars" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-600 py-2">
                  <List className="w-4 h-4" />
                  Car List
                </Link>
              )}

              {/* Menu untuk User Biasa */}
              {isLoggedIn && !isAdmin && (
                <>
                  <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-600 py-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link href="/my-rentals" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-600 py-2">
                    <Calendar className="w-4 h-4" />
                    My Rentals
                  </Link>
                  <Link href="/payment-history" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-600 py-2">
                    <CreditCard className="w-4 h-4" />
                    Payments
                  </Link>
                  <Link href="/cars" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-600 py-2">
                    <List className="w-4 h-4" />
                    Car List
                  </Link>
                </>
              )}

              {/* Menu untuk Admin */}
              {isLoggedIn && isAdmin && (
                <>
                  <Link href="/admin/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-600 py-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link href="/admin/manage-cars" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-600 py-2">
                    <Car className="w-4 h-4" />
                    Manage Cars
                  </Link>
                  <Link href="/admin/all-rentals" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-600 py-2">
                    <Calendar className="w-4 h-4" />
                    All Rentals
                  </Link>
                  <Link href="/admin/verify-payments" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-600 py-2">
                    <CreditCard className="w-4 h-4" />
                    Verify Payments
                  </Link>
                </>
              )}

              {/* Profile Link untuk semua user yang login */}
              {isLoggedIn && (
                <Link href="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-600 py-2">
                  <User className="w-4 h-4" />
                  My Profile
                </Link>
              )}

              {/* Auth Buttons */}
              <div className="border-t border-gray-100 pt-4 mt-2">
                {isLoggedIn ? (
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }} 
                    className="text-red-500 py-2 w-full text-left flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsOpen(false)} className="block py-2 text-gray-600">Sign In</Link>
                    <Link href="/register" onClick={() => setIsOpen(false)}>
                      <button className="bg-gradient-to-r from-[#D4AF37] to-[#C9A03D] text-white w-full mt-2 py-2 rounded-full">
                        Join Now
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}