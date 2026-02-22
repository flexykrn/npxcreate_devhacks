"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FolderOpen,
  Trash2,
  Star,
  Search,
  Calendar,
  FileText,
  Clock,
  X,
} from "lucide-react";
import { useApp } from "@/lib/AppContext";
import {
  getAllProjects,
  createProject,
  deleteProject,
  toggleFavorite,
  searchProjects,
  getFavoriteProjects,
  getRecentProjects,
  type Project,
} from "@/lib/localDb";

type SortOption = "recent" | "name" | "date";

export default function DashboardPage() {
  const router = useRouter();
  const { setCurrentProject, triggerRefresh, refreshTrigger } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterFavorites, setFilterFavorites] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjects();
  }, [refreshTrigger]);

  useEffect(() => {
    filterAndSortProjects();
  }, [projects, searchQuery, sortBy, filterFavorites]);

  const loadProjects = () => {
    const allProjects = getAllProjects();
    setProjects(allProjects);
  };

  const filterAndSortProjects = () => {
    let result = [...projects];

    if (searchQuery.trim()) {
      result = searchProjects(searchQuery);
    }

    if (filterFavorites) {
      result = result.filter(p => p.isFavorite);
    }

    switch (sortBy) {
      case "recent":
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case "name":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "date":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    setFilteredProjects(result);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowCreateModal(false);
      }
    }
    if (showCreateModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCreateModal]);

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCreateModal(true);
      }
      if (e.key === 'Escape' && showCreateModal) {
        setShowCreateModal(false);
      }
    };
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [showCreateModal]);

  const handleCreateProject = () => {
    if (projectTitle.trim()) {
      createProject(projectTitle.trim(), projectDescription.trim());
      setShowCreateModal(false);
      setProjectTitle("");
      setProjectDescription("");
      triggerRefresh();
    }
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(id);
      triggerRefresh();
    }
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(id);
    triggerRefresh();
  };

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
    router.push(`/project/${project.id}/tree`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#f5eeff] via-white to-[#ede9ff] pt-20 pb-8 pl-72 pr-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your projects and workflows</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 min-w-75 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all duration-200 text-sm"
            />
          </div>

          {/* Filters and Create Button */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm text-sm font-medium text-gray-700 hover:bg-white transition-all duration-200 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
            >
              <option value="recent">Recent</option>
              <option value="name">Name</option>
              <option value="date">Date Created</option>
            </select>

            {/* Favorites Filter */}
            <button
              onClick={() => setFilterFavorites(!filterFavorites)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                filterFavorites
                  ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                  : "border-gray-200 bg-white/70 text-gray-700 hover:bg-white"
              }`}
            >
              <Star className={`w-4 h-4 ${filterFavorites ? "fill-yellow-400 text-yellow-400" : ""}`} />
              Favorites
            </button>

            {/* Create Project Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              title="Create new project (Ctrl/Cmd + K)"
              className="group inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 px-5 py-2.5 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35 hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus className="w-5 h-5 text-white" strokeWidth={2} />
              <span className="text-sm font-semibold text-white">New Project</span>
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm shadow-purple-500/10 p-12 text-center">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || filterFavorites ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {searchQuery || filterFavorites
                ? "Try adjusting your filters or search query"
                : "Create your first project to get started!"}
            </p>
            {!searchQuery && !filterFavorites && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold text-sm shadow-lg transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                Create Project
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredProjects.length} {filteredProjects.length === 1 ? "Project" : "Projects"}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="group relative bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm shadow-purple-500/10 p-6 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  onClick={() => handleOpenProject(project)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-md shrink-0">
                        <FolderOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base truncate mb-1">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDate(project.updatedAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleToggleFavorite(project.id, e)}
                        className={`p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 ${
                          project.isFavorite ? "text-yellow-400" : "text-gray-400 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <Star className={`w-4 h-4 ${project.isFavorite ? "fill-yellow-400" : ""}`} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FileText className="w-4 h-4" />
                      <span>{project.nodes?.length || 0} nodes</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl shadow-purple-500/20 border border-purple-100 p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Create New Project</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="projectTitle" className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Title *
                </label>
                <input
                  id="projectTitle"
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleCreateProject()}
                  placeholder="Enter project title..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all duration-200 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="projectDescription" className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter project description..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all duration-200 text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!projectTitle.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
