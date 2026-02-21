"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import {
  GitBranch,
  FileText,
  Settings,
  TrendingUp,
  Plus,
  FolderOpen,
  Trash2,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load projects from localStorage
  useEffect(() => {
    const savedProjects = localStorage.getItem("projects");
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateProject = () => {
    if (projectName.trim()) {
      const newProject: Project = {
        id: Date.now().toString(),
        name: projectName.trim(),
        createdAt: new Date().toISOString(),
      };
      
      const updatedProjects = [newProject, ...projects];
      setProjects(updatedProjects);
      localStorage.setItem("projects", JSON.stringify(updatedProjects));
      
      setShowDropdown(false);
      setProjectName("");
      router.push("/main");
    }
  };

  const handleDeleteProject = (id: string) => {
    const updatedProjects = projects.filter((p) => p.id !== id);
    setProjects(updatedProjects);
    localStorage.setItem("projects", JSON.stringify(updatedProjects));
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
    <div className="flex h-screen bg-linear-to-br from-[#f5eeff] via-white to-[#ede9ff] overflow-hidden">
      <div className="pt-[72px] z-30 shrink-0">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      <main className="flex-1 pt-[72px] overflow-y-auto">
        <div className="w-full px-6 md:px-8 py-6">
          <div className="max-w-4xl">
            <div className="relative mb-8" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="group inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700
                  px-4 py-2.5 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35
                  hover:-translate-y-0.5 transition-all duration-200 ease-out"
              >
                <Plus className="w-5 h-5 text-white" strokeWidth={2} />
                <span className="text-sm font-semibold text-white">
                  Create New Project
                </span>
              </button>

              {showDropdown && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl shadow-purple-500/20 border border-purple-100 p-5 z-50">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">New Project</h3>
                  
                  <div className="mb-4">
                    <label htmlFor="projectName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Project Name
                    </label>
                    <input
                      id="projectName"
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                      placeholder="Enter project name..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all duration-200 text-sm"
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={handleCreateProject}
                    disabled={!projectName.trim()}
                    className="w-full px-4 py-2.5 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700
                      text-white font-semibold text-sm shadow-md hover:shadow-lg
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200"
                  >
                    Create
                  </button>
                </div>
              )}
            </div>

            {/* Projects List */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-violet-600" />
                My Projects ({projects.length})
              </h2>

              {projects.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm shadow-purple-500/10 p-8 text-center">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No projects yet. Create your first project to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="group relative bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm shadow-purple-500/10 p-5 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                      onClick={() => router.push("/main")}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-md">
                            <FolderOpen className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm line-clamp-1">
                              {project.name}
                            </h3>
                            <p className="text-xs text-gray-500">{formatDate(project.createdAt)}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
