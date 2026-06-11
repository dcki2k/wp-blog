/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { BlogPost } from "./types";
import BlogPostView from "./components/BlogPostView";
import AdminDashboard from "./components/AdminDashboard";
import CIDRCalculator from "./components/CIDRCalculator";
import BGPPathSimulator from "./components/BGPPathSimulator";
import VendorTranslator from "./components/VendorTranslator";
import { 
  Network, Search, Filter, Cpu, Layers, Terminal, BookOpen, 
  Settings, Wifi, RefreshCw, AlertCircle, Link, Mail, Server, ShieldCheck 
} from "lucide-react";

export default function App() {
  // Navigation states
  const [activePortalTab, setActivePortalTab] = useState<"blog" | "sandboxes" | "admin">("blog");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Standalone Sandbox utilities selected widget
  const [activeSandbox, setActiveSandbox] = useState<"subnet" | "bgp" | "compiler">("subnet");

  // Blog Posts list & states
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  
  // Network connection diagnostics status
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    setPostsError(null);
    try {
      const response = await fetch("/api/posts");
      if (!response.ok) {
        throw new Error("Local Express API failed. Check server is active.");
      }
      const data = await response.json();
      setPosts(data);
    } catch (err: any) {
      console.error("Failed to sync posts database:", err);
      setPostsError(err.message || "Failed to sync posts database.");
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleAddNewPost = async (newPost: BlogPost): Promise<boolean> => {
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });
      if (response.ok) {
        await fetchPosts(); // Refresh client databank state
        return true;
      }
    } catch (err) {
      console.error("Failed to commit post to server database:", err);
    }
    return false;
  };

  const handleDeletePost = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchPosts(); // Refresh client databank state
        if (selectedPostId === id) {
          setSelectedPostId(null);
        }
        return true;
      }
    } catch (err) {
      console.error("Failed to delete post on database server:", err);
    }
    return false;
  };

  // Extract unique tags for tag filter list
  const getUniqueTags = () => {
    const allTags = posts.flatMap(p => p.tags);
    return ["All", ...Array.from(new Set(allTags))];
  };

  // Filter blog posts based on search query or selected tag
  const getFilteredPosts = () => {
    return posts.filter(post => {
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTag = selectedTag === "All" || post.tags.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });
  };

  const selectedPost = posts.find(p => p.id === selectedPostId);

  return (
    <div id="main-interface" className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-emerald-500/10 selection:text-emerald-900">
      
      {/* Top Banner Header Indicator */}
      <div className="bg-slate-950 text-slate-400 text-[11px] font-mono py-1 px-4 border-b border-slate-900 flex justify-between items-center sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            NOC NODE ONLINE
          </span>
          <span className="text-slate-600">|</span>
          <span className="hidden sm:inline">Uplink Gateway: 198.51.100.254 (BGP Established)</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Sys Uptime: 99.999%</span>
          <span className="text-slate-600">|</span>
          <span>Buffer Log: Healthy</span>
        </div>
      </div>

      {/* Main Global Navigation Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div 
            onClick={() => { setSelectedPostId(null); setActivePortalTab("blog"); }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="p-2.5 bg-slate-900 rounded-xl text-emerald-400 group-hover:scale-105 transition-transform">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-lg font-extrabold tracking-tight text-slate-900">NetWP</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold font-mono uppercase px-1.5 py-0.5 rounded-md leading-none">NetOS v4.1</span>
              </div>
              <p className="text-xs text-slate-500 font-medium font-sans">WordPress for Infrastructure Engineers</p>
            </div>
          </div>

          <nav className="flex items-center gap-2 bg-slate-100 p-1 border border-slate-200 rounded-lg">
            <button
              onClick={() => { setSelectedPostId(null); setActivePortalTab("blog"); }}
              className={`px-4 py-1.5 rounded-md font-mono text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                activePortalTab === "blog" && !selectedPostId 
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Blog Portal</span>
            </button>
            <button
              onClick={() => { setSelectedPostId(null); setActivePortalTab("sandboxes"); }}
              className={`px-4 py-1.5 rounded-md font-mono text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                activePortalTab === "sandboxes" 
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Lab Sandboxes</span>
            </button>
            <button
              onClick={() => { setSelectedPostId(null); setActivePortalTab("admin"); }}
              className={`px-4 py-1.5 rounded-md font-mono text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                activePortalTab === "admin" 
                  ? "bg-white text-sky-600 shadow-sm border border-slate-200/50 animate-pulse" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>NOC Dashboard</span>
            </button>
          </nav>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        
        {/* Render BlogPostReader View (if selected) */}
        {selectedPost ? (
          <div className="bg-white min-h-[80vh] border-b border-slate-200 shadow-sm">
            <BlogPostView 
              post={selectedPost} 
              onBack={() => setSelectedPostId(null)} 
            />
          </div>
        ) : (
          <>
            {/* Tab: Public Blog Portal View */}
            {activePortalTab === "blog" && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                
                {/* Hero / Introduction */}
                <div className="bg-slate-950 text-slate-100 p-6 sm:p-8 rounded-2xl border border-slate-900 relative overflow-hidden shadow-xl">
                  {/* Digital Grid Lines background */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-70 pointer-events-none" />
                  <div className="absolute top-0 right-0 p-8 opacity-10 shrink-0 pointer-events-none">
                    <Server className="w-48 h-48 text-slate-100" />
                  </div>

                  <div className="relative z-10 max-w-3xl space-y-4">
                    <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Featured Infrastructure Log
                    </span>
                    <h1 className="text-2xl sm:text-3.5xl font-sans font-black tracking-tight text-white leading-tight">
                      NetWP - The Ultimate Technical Blogging Portal and Interactive Sandbox Labs
                    </h1>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-2xl font-sans">
                      Providing detailed OSPF guidelines, BGP multi-homing structures, classless CIDR planning binaries, and Cisco-to-Juniper translation compilers. Explore dynamic network diagram simulations embedded in posts.
                    </p>
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        onClick={() => setActivePortalTab("sandboxes")}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 border-none cursor-pointer"
                      >
                        <Cpu className="w-4 h-4" />
                        <span>Open Interactive Labs</span>
                      </button>
                      <button
                        onClick={() => setActivePortalTab("admin")}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-mono text-xs px-4 py-2 rounded-lg border border-slate-800 hover:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-sky-400" />
                        <span>Launch NOC Portal</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  
                  {/* Tag categories */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 uppercase tracking-wider font-bold">
                      <Filter className="w-3.5 h-3.5" /> Region Category:
                    </span>
                    {getUniqueTags().map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`text-[11px] font-mono px-3 py-1 rounded-md transition-all border ${
                          selectedTag === tag
                            ? "bg-slate-900 border-slate-900 text-slate-100 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {tag === "All" ? tag : `#${tag}`}
                      </button>
                    ))}
                  </div>

                  {/* Search query box */}
                  <div className="relative w-full md:w-80">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 pl-9 text-xs text-slate-800 focus:outline-none focus:border-slate-500 font-mono focus:bg-white"
                      placeholder="Keyword: e.g. BGP, anycast..."
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>

                </div>

                {/* Error/Loading display */}
                {loadingPosts && (
                  <div className="p-10 text-center text-slate-500 font-mono space-y-3 flex flex-col items-center justify-center">
                    <RefreshCw className="w-7 h-7 text-sky-500 animate-spin" />
                    <p className="text-xs">Synchronizing active route database streams...</p>
                  </div>
                )}

                {postsError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-800 font-mono">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <h4 className="font-bold">Database Out of Sync</h4>
                      <p className="text-xs text-red-600/80 mt-1">{postsError}</p>
                    </div>
                  </div>
                )}

                {/* Blog Grid List representation */}
                {!loadingPosts && !postsError && (
                  <>
                    {getFilteredPosts().length === 0 ? (
                      <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400 space-y-1">
                        <p className="font-mono text-xs">NO DOCS RETURNED BY PATH FILTERS</p>
                        <p className="text-xs text-slate-500">Try modifying search keyword queries or tag matrices.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {getFilteredPosts().map((post) => (
                          <article 
                            key={post.id}
                            onClick={() => setSelectedPostId(post.id)}
                            className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-lg rounded-2xl p-5 transition-all flex flex-col justify-between cursor-pointer group"
                          >
                            <div className="space-y-3">
                              {/* Metadata line */}
                              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Wifi className="w-3 h-3 text-emerald-400" /> {post.author.split(",")[0]}
                                </span>
                                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                              </div>

                              <h3 className="text-lg font-sans font-bold text-slate-900 group-hover:text-emerald-600 transition-colors leading-snug">
                                {post.title}
                              </h3>

                              <p className="text-xs text-slate-500 leading-relaxed font-sans line-clamp-3">
                                {post.summary}
                              </p>
                            </div>

                            {/* bottom indicators & badges */}
                            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                              <div className="flex gap-1.5">
                                {post.tags.slice(0, 2).map((tag) => (
                                  <span key={tag} className="text-[9px] font-mono bg-slate-50 border border-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                              <span className="text-[10px] font-mono text-emerald-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                Load LAB config &gt;
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </>
                )}

              </div>
            )}

            {/* Tab: Standalone Sandbox Laboratories */}
            {activePortalTab === "sandboxes" && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Side Sandbox Controls */}
                <div className="lg:col-span-3 space-y-3.5">
                  <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-1">
                    <h3 className="font-sans font-bold text-slate-800 text-sm">Laboratories Sandbox Control</h3>
                    <p className="text-xs text-slate-500">Standalone access to active simulation instances.</p>
                  </div>

                  <div className="flex flex-col gap-2 bg-white border border-slate-200 p-2 rounded-xl">
                    <button
                      onClick={() => setActiveSandbox("subnet")}
                      className={`w-full text-left font-mono text-xs py-2 px-3 rounded-lg transition border-none cursor-pointer flex items-center gap-2 ${
                        activeSandbox === "subnet" 
                          ? "bg-slate-950 text-slate-100 font-bold" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Subnet Bitmask Planner</span>
                    </button>
                    <button
                      onClick={() => setActiveSandbox("bgp")}
                      className={`w-full text-left font-mono text-xs py-2 px-3 rounded-lg transition border-none cursor-pointer flex items-center gap-2 ${
                        activeSandbox === "bgp" 
                          ? "bg-slate-950 text-slate-100 font-bold" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Network className="w-3.5 h-3.5" />
                      <span>BGP Path Decision Matrix</span>
                    </button>
                    <button
                      onClick={() => setActiveSandbox("compiler")}
                      className={`w-full text-left font-mono text-xs py-2 px-3 rounded-lg transition border-none cursor-pointer flex items-center gap-2 ${
                        activeSandbox === "compiler" 
                          ? "bg-slate-950 text-slate-100 font-bold" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>IOS-to-Junos CLI Translator</span>
                    </button>
                  </div>
                </div>

                {/* Main Sandbox Workspace view */}
                <div className="lg:col-span-9 space-y-4">
                  {activeSandbox === "subnet" && <CIDRCalculator />}
                  {activeSandbox === "bgp" && <BGPPathSimulator />}
                  {activeSandbox === "compiler" && <VendorTranslator />}
                </div>

              </div>
            )}

            {/* Tab: NOC Administrator Control Panel */}
            {activePortalTab === "admin" && (
              <AdminDashboard 
                posts={posts} 
                onAddPost={handleAddNewPost} 
                onDeletePost={handleDeletePost} 
              />
            )}
          </>
        )}

      </main>

      {/* Footer Navigation */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-12 border-t border-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-indigo-200">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-950 rounded text-emerald-400">
                <Network className="w-4 h-4" />
              </div>
              <span className="font-mono text-sm tracking-tight text-white font-bold">NetWP Operations Console</span>
            </div>
            <p className="text-slate-400 leading-normal font-sans">
              A bespoke full-stack blogging portal built purposefully for infrastructure engineers, network architects, and tech documentarians. Optimized for clean markdown rendering.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-mono text-sm text-slate-200 font-bold uppercase tracking-wider">Dynamic Router Nodes</h4>
            <ul className="space-y-1 text-slate-400 font-mono">
              <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" /> Chicago Border AS-65001</li>
              <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" /> London Anycast Destination</li>
              <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" /> Singapore Transit OSPF</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-mono text-sm text-slate-200 font-bold uppercase tracking-wider">Interactive Lab Specifications</h4>
            <p className="text-slate-400 leading-normal">
              Our interactive lab widgets calculate networks locally per standard RFC classes and simulate Border Path transitions per general ISP matrices.
            </p>
            <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Diagnostic System Standards Confirmed</span>
            </div>
          </div>

        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 mt-6 border-t border-slate-950 text-center text-[10px] text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} NetWP Network Engineering Portal. Compiled by AI Studio container.</span>
          <span className="flex items-center gap-1.5">
            <Link className="w-3 h-3 text-slate-600" /> BGP Peer active path: 192.0.2.1/32
          </span>
        </div>
      </footer>

    </div>
  );
}
