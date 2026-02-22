"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  Home,
  Layers,
  Users,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  LogOut,
  User,
} from "lucide-react";
import { useApp } from "@/lib/AppContext";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, currentProject, setCurrentProject, setCurrentNodeId } = useApp();

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isUserDropdownOpen && !target.closest('.user-dropdown-container')) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Features", href: "/#features", icon: Layers },
    { name: "About", href: "/#about", icon: Users },
  ];
  
  const isLoggedIn = !!user;
  const isInProject = pathname?.startsWith('/project/') || pathname === '/main' || pathname === '/notebook';
  
  const getCurrentPage = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/main' || pathname?.includes('/tree')) return 'Tree';
    if (pathname === '/notebook' || pathname?.includes('/notebook')) return 'Notebook';
    return '';
  };
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    localStorage.clear();
    setUser(null);
    setCurrentProject(null);
    setCurrentNodeId(null);
    router.push('/');
  };

  return (
    <>
      <nav className="fixed rounded-4xl w-full top-0 left-0 m-2 z-50 bg-linear-to-r from-[#cfaad8]/30 via-[#934acb]/30 to-[#48229a]/30 backdrop-blur-xl shadow-sm shadow-purple-500/20 border border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              href="/"
              className="group flex items-center gap-2.5 select-none"
            >
              <div className="relative w-9 h-9 rounded-xl bg-linear-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow duration-300">
                <Sparkles className="w-5 h-5 text-white" />
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-gray-900">
                ScriptED
              </span>
            </Link>

            {/* Breadcrumbs or Navigation */}
            <div className="hidden md:flex items-center">
              {isLoggedIn ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100/80 rounded-full">
                  <Link 
                    href="/dashboard"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Dashboard
                  </Link>
                  {currentProject && (
                    <>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {currentProject.title}
                      </span>
                    </>
                  )}
                  {isInProject && getCurrentPage() && (
                    <>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-blue-600">
                        {getCurrentPage()}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-gray-100/80 rounded-full px-1.5 py-1">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300 ${
                          isActive
                            ? "text-white"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute inset-0 rounded-full bg-linear-to-r from-blue-600 to-violet-600 shadow-md shadow-blue-500/25 animate-[fadeIn_0.3s_ease]" />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <link.icon className="w-3.5 h-3.5" />
                          {link.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right side actions */}
            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  {/* Search Icon */}
                  <button className="p-2 text-black hover:text-gray-900 hover:bg-gray-100/80 rounded-full transition-all duration-200">
                    <Search className="w-5 h-5" />
                  </button>
                  
                  {/* Notifications */}
                  <button className="relative p-2 text-black hover:text-gray-900 hover:bg-gray-100/80 rounded-full transition-all duration-200">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                  
                  {/* User Dropdown */}
                  <div className="relative user-dropdown-container">
                    <button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100/80 rounded-full hover:bg-gray-200/80 transition-all duration-200"
                    >
                      <div className="w-7 h-7 rounded-full bg-linear-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="max-w-25 truncate">{user?.name || 'User'}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isUserDropdownOpen && (
                      <div className="absolute top-full mt-2 right-0 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                          <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                        </div>
                        <div className="border-t border-gray-200">
                          <button
                            onClick={() => {
                              setIsUserDropdownOpen(false);
                              handleLogout();
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors duration-200"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="group relative inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
                  >
                    <span className="absolute inset-0 bg-linear-to-r from-blue-600 to-violet-600" />
                    <span className="absolute inset-0 bg-linear-to-r from-violet-600 to-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="relative z-10">Get Started</span>
                    <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <span
                className={`absolute transition-all duration-300 ${
                  isMobileMenuOpen
                    ? "rotate-0 opacity-100"
                    : "rotate-90 opacity-0"
                }`}
              >
                <X className="w-5 h-5" />
              </span>
              <span
                className={`absolute transition-all duration-300 ${
                  isMobileMenuOpen
                    ? "-rotate-90 opacity-0"
                    : "rotate-0 opacity-100"
                }`}
              >
                <Menu className="w-5 h-5" />
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div
       className={`fixed top-16.5 right-0 z-50 w-72 h-[calc(100vh-66px)] bg-linear-to-b from-[#cfaad8]/40 via-[#934acb]/40 to-[#48229a]/40 backdrop-blur-xl border-l border-white/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {isLoggedIn ? (
            // Logged-in user menu
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 p-3 bg-white/20 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-600 truncate">{user?.email || 'user@example.com'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-300"
                >
                  <Home className="w-5 h-5" />
                  Dashboard
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-black hover:bg-gray-100 hover:text-gray-900 transition-all duration-300"
                >
                  <Search className="w-5 h-5" />
                  Search
                </button>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-black hover:bg-gray-100 hover:text-gray-900 transition-all duration-300"
                >
                  <Bell className="w-5 h-5" />
                  Notifications
                </button>
              </div>

              <div className="mt-auto flex flex-col gap-1 pt-6 border-t border-gray-200/60">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition-all duration-300"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            // Non-logged-in user menu
            <>
              <div className="flex flex-col gap-1">
                {navLinks.map((link, i) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                        isActive
                          ? "bg-linear-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/20"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                      style={{
                        transitionDelay: isMobileMenuOpen ? `${i * 50}ms` : "0ms",
                        transform: isMobileMenuOpen
                          ? "translateX(0)"
                          : "translateX(20px)",
                        opacity: isMobileMenuOpen ? 1 : 0,
                      }}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.name}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-gray-200/60">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center px-5 py-3 text-sm font-semibold text-gray-700 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center px-5 py-3 text-sm font-semibold text-white rounded-xl bg-linear-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow duration-300"
                >
                  Get Started
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}