"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  FolderOpen,
  Star,
  Settings,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  FileText,
} from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { getRecentProjects, getFavoriteProjects, getDeletedProjects, type Project } from "@/lib/localDb";

export default function Sidebar() {
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(true);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [favoriteProjects, setFavoriteProjects] = useState<Project[]>([]);
  const [deletedCount, setDeletedCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { currentProject, setCurrentProject, refreshTrigger } = useApp();

  useEffect(() => {
    loadProjects();
  }, [refreshTrigger]);

  const loadProjects = () => {
    const recent = getRecentProjects(5);
    const favorites = getFavoriteProjects();
    const deleted = getDeletedProjects();
    setRecentProjects(recent);
    setFavoriteProjects(favorites);
    setDeletedCount(deleted.length);
  };

  const shouldShowSidebar = 
    pathname === '/dashboard' || 
    pathname?.startsWith('/project/') ||
    pathname === '/main' ||
    pathname === '/notebook' ||
    pathname === '/recycle-bin';

  if (!shouldShowSidebar) {
    return null;
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === '/dashboard',
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      isActive: pathname === '/settings',
    },
    {
      name: "Recycle Bin",
      href: "/recycle-bin",
      icon: Trash2,
      isActive: pathname === '/recycle-bin',
    },
  ];

  return (
    <aside className="fixed left-2 top-20 bottom-2 w-64 bg-linear-to-b from-[#cfaad8]/20 via-[#934acb]/20 to-[#48229a]/20 backdrop-blur-xl border border-white/20 rounded-3xl shadow-lg shadow-purple-500/10 overflow-hidden z-40">
      <div className="flex flex-col h-full p-4 overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-1 mb-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                item.isActive
                  ? "bg-linear-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/20"
                  : "text-gray-700 hover:bg-white/40 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
              {item.name === "Recycle Bin" && deletedCount > 0 && (
                <span className={`ml-auto px-2 py-0.5 text-xs font-semibold rounded-full ${
                  item.isActive 
                    ? "bg-white/20 text-white" 
                    : "bg-gray-200 text-gray-700"
                }`}>
                  {deletedCount}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* My Projects Section */}
        <div className="mb-6">
          <button
            onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
            className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              MY PROJECTS
            </span>
            {isProjectsExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {isProjectsExpanded && (
            <div className="mt-2 space-y-1">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      setCurrentProject(project);
                      router.push('/main');
                    }}
                    className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer ${
                      currentProject?.id === project.id
                        ? "bg-white/50 text-blue-600 font-medium"
                        : "text-gray-600 hover:bg-white/40 hover:text-gray-900"
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate flex-1">{project.title}</span>
                    {project.isFavorite && (
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-gray-500 text-center">
                  No recent projects
                </div>
              )}
              
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 w-full px-4 py-2 rounded-xl text-sm text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>
          )}
        </div>

        {/* Favorites Section */}
        <div className="mb-6">
          <button
            onClick={() => setIsFavoritesExpanded(!isFavoritesExpanded)}
            className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              FAVORITES
            </span>
            {isFavoritesExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {isFavoritesExpanded && (
            <div className="mt-2 space-y-1">
              {favoriteProjects.length > 0 ? (
                favoriteProjects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      setCurrentProject(project);
                      router.push('/main');
                    }}
                    className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all duration-200 cursor-pointer ${
                      currentProject?.id === project.id
                        ? "bg-white/50 text-blue-600 font-medium"
                        : "text-gray-600 hover:bg-white/40 hover:text-gray-900"
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate flex-1">{project.title}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-gray-500 text-center">
                  No favorite projects
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Current Project Info */}
        {currentProject && (
          <div className="mt-auto pt-4 border-t border-white/20">
            <div className="px-4 py-3 bg-white/30 rounded-xl">
              <div className="text-xs font-semibold text-gray-600 mb-1">CURRENT PROJECT</div>
              <div className="text-sm font-medium text-gray-900 truncate">{currentProject.title}</div>
              <div className="text-xs text-gray-600 mt-1">{currentProject.nodes?.length || 0} nodes</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
