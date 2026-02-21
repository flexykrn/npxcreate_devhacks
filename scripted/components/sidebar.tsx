"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  Layers,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Home", href: "/", icon: Home },
  { name: "Features", href: "/features", icon: Layers },
  { name: "About", href: "/about", icon: Users },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem("currentUser");
      localStorage.removeItem("userId");
      router.push("/login");
    }
  }

  return (
    <aside
      className={`relative shrink-0 flex flex-col h-full
        bg-linear-to-b from-[#cfaad8]/20 via-[#934acb]/20 to-[#48229a]/20
        backdrop-blur-xl border-r border-white/20 shadow-lg shadow-purple-500/10
        transition-all duration-300 ease-in-out rounded-xl
        ${collapsed ? "w-17" : "w-56"}`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-6 z-50 w-7 h-7 rounded-full
          bg-linear-to-br from-blue-600 to-violet-600
          flex items-center justify-center shadow-md shadow-blue-500/30
          hover:scale-110 transition-transform duration-200 text-white"
        aria-label="Toggle sidebar"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 p-3 flex-1 mt-2">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              title={collapsed ? link.name : undefined}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-sm font-medium transition-all duration-200 overflow-hidden
                ${isActive
                  ? "text-white shadow-md shadow-blue-500/20"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/40"
                }`}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-linear-to-r from-blue-600 to-violet-600" />
              )}
              <link.icon
                className={`relative z-10 shrink-0 w-4.5 h-4.5 transition-transform duration-200
                  ${isActive ? "text-white" : "text-gray-500 group-hover:text-violet-600"}`}
              />
              <span
                className={`relative z-10 whitespace-nowrap transition-all duration-300
                  ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}`}
              >
                {link.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/20">
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/60
            transition-all duration-200"
        >
          <LogOut className="shrink-0 w-4.5 h-4.5" />
          <span
            className={`whitespace-nowrap transition-all duration-300
              ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"}`}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
