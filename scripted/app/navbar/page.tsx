"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Home,
  Layers,
  CreditCard,
  Users,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Features", href: "/features", icon: Layers },
    { name: "About", href: "/about", icon: Users },
  ];

  return (
    <>
      <nav className="fixed rounded-4xl w-full top-0 left-0 mx-4 my-4 z-50 bg-gradient-to-r from-[#cfaad8]/30 via-[#934acb]/30 to-[#48229a]/30 backdrop-blur-xl shadow-sm shadow-purple-500/20 border border-white/20">


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
              <span className="text-xl font-extrabold tracking-tight bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Scripted
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center">
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
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
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
       className={`fixed top-16.5 right-0 z-50 w-72 h-[calc(100vh-66px)] bg-gradient-to-b from-[#cfaad8]/40 via-[#934acb]/40 to-[#48229a]/40 backdrop-blur-xl border-l border-white/20 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6">
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
        </div>
      </div>
    </>
  );
}