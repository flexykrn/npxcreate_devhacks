"use client";

import { Button } from "@/components/ui/button"
import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  GitBranch, 
  FileText, 
  Zap, 
  Users, 
  Search, 
  Download,
  Lightbulb,
  Rocket,
  Target
} from "lucide-react";


export default function Page() {
  const [isDancing, setIsDancing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsDancing(true);
      setTimeout(() => setIsDancing(false), 600);
    }, 3000);

    return () => clearInterval(interval);
  }, []);
  const features = [
    {
      icon: GitBranch,
      title: "Interactive Node Tree",
      description: "Build unlimited hierarchical knowledge trees with gitflow-style branching and drag-drop functionality."
    },
    {
      icon: FileText,
      title: "Multi-Page Notebooks",
      description: "Create rich documents with auto-save, markdown support, and seamless navigation between pages."
    },
    {
      icon: Zap,
      title: "Real-time Collaboration",
      description: "Work together with your team in real-time, share projects, and manage permissions effortlessly."
    },
    {
      icon: Search,
      title: "Smart Search & Filter",
      description: "Quickly find projects with advanced search and filtering options across all your workspaces."
    },
    {
      icon: Download,
      title: "Zoom & Pan Navigation",
      description: "Navigate large node trees easily with mouse wheel zoom, pan controls, and fit-to-view functionality."
    },
    {
      icon: Users,
      title: "Project Management",
      description: "Organize projects with favorites, recent views, recycle bin, and comprehensive dashboard."
    }
  ];

  return (
    <div className='bg-linear-to-br from-[#cfaad8] via-[#934acb] to-[#48229a] min-h-screen'>
      {/* Hero Section */}
      <section className="min-h-screen pt-32 pb-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Text Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1
                  className="text-6xl md:text-7xl lg:text-8xl font-extrabold leading-tight text-white inline-block"
                  style={{
                    animation: isDancing ? 'dance 0.6s ease-in-out' : 'none',
                  }}
                >
                  ScriptED
                </h1>

                {/* Branch breakdown */}
                <div className="relative pl-2 pt-2 ml-43 -mt-10">
                  <style>{`
                    @keyframes drawLine {
                      from { stroke-dashoffset: 300; }
                      to   { stroke-dashoffset: 0; }
                    }
                    @keyframes flowDot {
                      0%   { offset-distance: 0%;   opacity: 0; }
                      10%  { opacity: 1; }
                      90%  { opacity: 1; }
                      100% { offset-distance: 100%; opacity: 0; }
                    }
                    @keyframes glowPulse {
                      0%, 100% { filter: drop-shadow(0 0 4px #c084fc) drop-shadow(0 0 8px #a855f7); }
                      50%      { filter: drop-shadow(0 0 10px #e879f9) drop-shadow(0 0 20px #d946ef); }
                    }
                    @keyframes nodeAppear {
                      from { opacity: 0; transform: scale(0.6) translateY(8px); }
                      to   { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    @keyframes shimmer {
                      0%   { background-position: -200% center; }
                      100% { background-position: 200% center; }
                    }
                    .branch-svg { animation: glowPulse 2.5s ease-in-out infinite; }
                    .draw-path {
                      stroke-dasharray: 300;
                      stroke-dashoffset: 300;
                      animation: drawLine 1s cubic-bezier(0.4,0,0.2,1) forwards;
                    }
                    .draw-path-left  { animation-delay: 0.3s; }
                    .draw-path-right { animation-delay: 0.55s; }
                    .flow-dot {
                      r: 3;
                      fill: #e879f9;
                      filter: drop-shadow(0 0 5px #e879f9);
                      offset-rotate: 0deg;
                      animation: flowDot 1.8s ease-in-out infinite;
                    }
                    .flow-dot-left  { offset-path: path('M 100 0 C 100 40, 40 50, 40 90'); animation-delay: 0.8s; }
                    .flow-dot-right { offset-path: path('M 100 0 C 100 40, 160 50, 160 90'); animation-delay: 1.1s; }
                    .node-left  { animation: nodeAppear 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.9s both; }
                    .node-right { animation: nodeAppear 0.5s cubic-bezier(0.34,1.56,0.64,1) 1.15s both; }
                    .shimmer-text {
                      background: linear-gradient(90deg, #fff 0%, #e879f9 40%, #a855f7 60%, #fff 100%);
                      background-size: 200% auto;
                      -webkit-background-clip: text;
                      -webkit-text-fill-color: transparent;
                      background-clip: text;
                      animation: shimmer 2.5s linear infinite;
                    }
                  `}</style>

                  <svg
                    className="branch-svg mb-2"
                    width="200"
                    height="95"
                    viewBox="0 0 200 95"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e879f9" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                    {/* left curved branch */}
                    <path className="draw-path draw-path-left"  d="M 100 5 C 100 50, 40 50, 40 90" stroke="#111" strokeWidth="4" strokeLinecap="round" fill="none"/>
                    {/* right curved branch */}
                    <path className="draw-path draw-path-right" d="M 100 5 C 100 50, 160 50, 160 90" stroke="#111" strokeWidth="4" strokeLinecap="round" fill="none"/>
                    {/* flowing dots */}
                    <circle className="flow-dot flow-dot-left" />
                    <circle className="flow-dot flow-dot-right" />
                    {/* junction dots */}
                    <circle cx="40"  cy="90" r="6" fill="#111" stroke="#e879f9" strokeWidth="2"/>
                    <circle cx="160" cy="90" r="6" fill="#111" stroke="#818cf8" strokeWidth="2"/>
                    <circle cx="100" cy="5"  r="5" fill="#111" stroke="#ffffff" strokeWidth="2"/>
                  </svg>

                  <div className="flex gap-4">
                    {/* Script node */}
                    <div className="node-left flex flex-col items-center gap-1.5 w-[80px]">
                      <div className="px-4 py-2 rounded-xl bg-white/10 border border-purple-400/50 backdrop-blur-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-400/40 hover:scale-105 transition-all duration-300 cursor-default">
                        <span className="shimmer-text text-xl font-extrabold tracking-wide">Script</span>
                      </div>
                      <p className="text-[10px] text-purple-900 text-center leading-tight">Structured writing &amp; notes</p>
                    </div>

                    {/* spacer to match SVG gap */}
                    <div className="w-[60px]" />

                    {/* Aid node */}
                    <div className="node-right flex flex-col items-center gap-1.5 w-[80px]">
                      <div className="px-4 py-2 rounded-xl bg-white/10 border border-indigo-400/50 backdrop-blur-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-400/40 hover:scale-105 transition-all duration-300 cursor-default">
                        <span className="shimmer-text text-xl font-extrabold tracking-wide">Aid</span>
                      </div>
                      <p className="text-[10px] text-purple-900 text-center leading-tight">AI-powered assistance</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-lg md:text-2xl text-black max-w-xl leading-relaxed font-bold">
                Enter the future of decentralized knowledge management. Simplify organization, enhance creativity, and take control of your digital workspace.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  asChild
                  className="text-lg px-8 py-6 bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 rounded-xl transition-all duration-300"
                >
                  <Link href="/login">Connect Account</Link>
                </Button>
                
                <Button
                  asChild
                  className="text-lg px-8 py-6 bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/30"
                >
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>

              <p className="text-sm text-purple-400 font-medium pt-4">
                Powered by Modern Web Technology
              </p>
            </div>

            {/* Right Side - Vintage TV Frame with Video */}
            <div className="relative flex items-start justify-center -mt-60">
              {/* Vintage TV Frame */}
              <div className="relative w-full max-w-lg">
                {/* TV Body */}
                <div className="relative bg-linear-to-b from-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl border-4 border-gray-700">
                  {/* Antenna */}
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 flex gap-12">
                    <div className="w-1 h-16 bg-gray-600 transform -rotate-45 origin-bottom"></div>
                    <div className="w-1 h-16 bg-gray-600 transform rotate-45 origin-bottom"></div>
                  </div>

                  {/* Screen Container */}
                  <div className="relative bg-black rounded-2xl overflow-hidden border-8 border-gray-900 shadow-inner">
                    {/* Screen Glow Effect */}
                    <div className="absolute inset-0 bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 pointer-events-none z-10"></div>
                    
                    {/* Scanline Effect */}
                    <div className="absolute inset-0 pointer-events-none z-20" style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)',
                      animation: 'scanline 8s linear infinite',
                    }}></div>

                    {/* Video Player */}
                    <div className="relative aspect-video bg-black">
                      <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                        src="/animation.mp4"
                      />
                    </div>
                  </div>

                  {/* TV Controls */}
                  <div className="mt-6 flex justify-between items-center px-4">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-gray-600"></div>
                      <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-gray-600"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                </div>

                {/* Brand Label */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 px-6 py-2 rounded-full border-2 border-gray-700">
                  <span className="text-purple-400 font-bold text-sm tracking-wider">ScriptED TV</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white/10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Zap className="w-10 h-10 text-yellow-300" />
              <h2 className="text-5xl font-bold text-white">Features</h2>
            </div>
            <div className="w-24 h-1 bg-purple-300 mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Everything you need to build, organize, and manage your knowledge base
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl hover:shadow-white/10 transition-all duration-300 hover:scale-105"
                >
                  <div className="bg-white/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Lightbulb className="w-10 h-10 text-yellow-300" />
              <h2 className="text-5xl font-bold text-white">About ScriptED</h2>
            </div>
            <div className="w-24 h-1 bg-purple-300 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 border border-white/30 hover:bg-white/30 transition-all duration-300">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">Our Mission</h3>
              <p className="text-white/90 text-center leading-relaxed">
                To revolutionize how people organize and visualize their ideas through an intuitive, tree-based knowledge management system.
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 border border-white/30 hover:bg-white/30 transition-all duration-300">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Rocket className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">Our Vision</h3>
              <p className="text-white/90 text-center leading-relaxed">
                Create a platform where complex projects are simplified through visual hierarchies, making knowledge accessible and actionable.
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 border border-white/30 hover:bg-white/30 transition-all duration-300">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Lightbulb className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 text-center">Our Values</h3>
              <p className="text-white/90 text-center leading-relaxed">
                Simplicity, innovation, and user empowerment. We believe great tools should be powerful yet easy to use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-white/10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Join thousands of users who are already organizing their ideas with ScriptED
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              asChild
              className="text-2xl rounded-2xl bg-white text-purple-600 px-10 py-6 transition-all duration-300 hover:bg-purple-100 hover:shadow-2xl hover:shadow-white/20 hover:scale-105">
              <Link href="/signup">Create Free Account</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="text-2xl rounded-2xl border-2 border-white bg-white/20 backdrop-blur-sm text-white px-10 py-6 transition-all duration-300 hover:bg-white hover:text-purple-600 hover:shadow-2xl hover:shadow-white/20 hover:scale-105">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

