"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RotateCcw, X, Clock } from "lucide-react";
import { getDeletedProjects, restoreProject, permanentlyDeleteProject } from "@/lib/localDb";
import type { Project } from "@/lib/localDb";

export default function RecycleBinPage() {
  const router = useRouter();
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDeletedProjects();
  }, []);

  const loadDeletedProjects = () => {
    const projects = getDeletedProjects();
    setDeletedProjects(projects);
    setIsLoading(false);
  };

  const handleRestore = (id: string) => {
    restoreProject(id);
    loadDeletedProjects();
  };

  const handlePermanentDelete = (id: string, title: string) => {
    if (confirm(`Permanently delete "${title}"? This action cannot be undone.`)) {
      permanentlyDeleteProject(id);
      loadDeletedProjects();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-purple-50 to-blue-50 flex items-center justify-center pt-20 pl-72">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-purple-50 to-blue-50 pt-20 pb-8 pl-72 pr-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trash2 className="w-8 h-8 text-gray-700" />
            <h1 className="text-4xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Recycle Bin
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Deleted projects are stored here. You can restore them or permanently delete them.
          </p>
        </div>

        {/* Empty State */}
        {deletedProjects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Recycle Bin is Empty
            </h2>
            <p className="text-gray-500 mb-6">
              No deleted projects found. Deleted projects will appear here.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Projects Count */}
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                {deletedProjects.length} {deletedProjects.length === 1 ? "project" : "projects"} in recycle bin
              </p>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deletedProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {project.description || "No description"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>Deleted {formatDate(project.deletedAt || project.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(project.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-linear-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-md transition-all duration-200"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(project.id, project.title)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all duration-200"
                      title="Permanently Delete"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Project Info */}
                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>{project.nodes.length} nodes</span>
                      <span>Created {formatDate(project.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
