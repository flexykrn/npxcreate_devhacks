"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import {
  GitBranch,
  FileText,
  Settings,
  TrendingUp,
  Plus,
} from "lucide-react";

const actionButtons = [
  { 
    label: "Create New Project", 
    icon: Plus, 
    color: "from-blue-600 to-violet-600",
    hoverColor: "hover:from-blue-700 hover:to-violet-700",
    href: "/main" 
  }
];

export default function DashboardPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-linear-to-br from-[#f5eeff] via-white to-[#ede9ff] overflow-hidden">
      <div className="pt-[72px] z-30 shrink-0">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      <main className="flex-1 pt-[72px] overflow-y-auto flex items-center justify-center">
        <div className="w-full max-w-4xl px-6 md:px-8">
          <div className="flex justify-start">
            {actionButtons.map((action) => (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className={`group inline-flex items-center gap-2 rounded-xl bg-linear-to-r ${action.color} ${action.hoverColor} 
                  px-4 py-2.5 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35
                  hover:-translate-y-0.5 transition-all duration-200 ease-out`}
              >
                <action.icon className="w-5 h-5 text-white" strokeWidth={2} />
                <span className="text-sm font-semibold text-white">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
