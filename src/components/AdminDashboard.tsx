/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { BlogPost, NetworkWidgetType } from "../types";
import { 
  Plus, Trash2, Cpu, FileText, Send, Sparkles, Code, HelpCircle, 
  Settings, Terminal, Layers, AlertCircle, ShieldCheck, CheckCircle2 
} from "lucide-react";
import SyslogNocPanel from "./SyslogNocPanel";

interface AdminDashboardProps {
  posts: BlogPost[];
  onAddPost: (post: BlogPost) => Promise<boolean>;
  onDeletePost: (id: string) => Promise<boolean>;
}

export default function AdminDashboard({ posts, onAddPost, onDeletePost }: AdminDashboardProps) {
  // Navigation tabs in admin
  const [activeTab, setActiveTab] = useState<"write" | "manage" | "logs">("write");

  // Form states
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [widgetType, setWidgetType] = useState<NetworkWidgetType>("none");
  const [author, setAuthor] = useState("Thorne Network Core Engine");

  // App notification state
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const handleManualPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!slug || !title || !content) {
      setSubmitError("Slug ID, Title, and Article Content are absolutely required to publish.");
      return;
    }

    const tagList = tags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const postPayload: BlogPost = {
      id: slug,
      title,
      summary: summary || "Network architecture detailing advanced telemetry protocols and operational updates.",
      content,
      author,
      createdAt: new Date().toISOString(),
      tags: tagList.length > 0 ? tagList : ["General"],
      widgetType,
    };

    const isOk = await onAddPost(postPayload);
    if (isOk) {
      // clear fields or show notice
      setSubmitSuccess(`Network post "${title}" successfully synchronized and published directly into Database!`);
      // Reset main form
      setSlug("");
      setTitle("");
      setSummary("");
      setContent("");
      setTags("");
      setWidgetType("none");
    } else {
      setSubmitError("Server failed to persist the post payload to JSON database.");
    }
  };

  const fillQuickFormTemplate = (style: "postmortem" | "bgp" | "cidr") => {
    if (style === "postmortem") {
      setSlug("mtu-mismatch-ospf");
      setTitle("OSPF Adjacency Failures: The MTU Dimension");
      setSummary("Operational deep dive analyzing why mismatched Maximum Transmission Units drop OSPF link bindings.");
      setContent("# OSPF Adjacency Failures: The MTU Dimension\n\nWhen deploying Open Shortest Path First (OSPF) across redundant Ethernet links, engineers frequently map MTU lengths over wan trunks.\n\n## The Symptom\nOSPF neighbor relationships transition from INIT to EXCHANGE, but flap repeatedly without establishing full neighbor tables.\n\n### The Root Cause\nUnder RFC 2328, routers advertise their local interface MTU inside OSPF Database Description (DBD) packets. If adjacent interfaces disagree on MTU configuration, the receiver drops DBD frames larger than its configured length. This blocks routing maps.\n\n## Troubleshooting Checklist\n- Check local values using `show ip ospf interface`\n- Verify remote physical frame counts\n- Enforce `ip ospf mtu-ignore` only as an temporary engineering bypass!");
      setTags("OSPF, MTU, Troubleshooting");
      setWidgetType("config-translator");
    } else if (style === "bgp") {
      setSlug("transit-prepends");
      setTitle("Understanding AS Prepending Tricks");
      setSummary("How Border Gateway routers use prepend flags to control entry from public transit networks.");
      setContent("# Understanding AS Prepending Tricks\n\nAS-Path Prepending is a routing mapping construct to direct downstream ingress paths locally.\n\n## BGP Metrics review\n- Local Preference controls exit paths (our router choices)\n- AS-Path prepends influence incoming entry traffic (external router choices)\n\nBy appending our ASN multiple times in external advertisements, we increase path metrics, discouraging external ISPs from feeding paths directly.");
      setTags("BGP, Multipath, ISP");
      setWidgetType("bgp-sim");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4 px-4 space-y-6">
      
      {/* Admin Title bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-500 animate-[spin_5s_linear_infinite]" />
            <h1 className="text-xl font-mono font-bold text-slate-900 tracking-tight">NetWP NOC Portal Console</h1>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">Control panel, database sync & local telemetry logs</p>
        </div>

        {/* Dashboard Navigation */}
        <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs font-mono font-medium">
          <button
            onClick={() => setActiveTab("write")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "write" ? "bg-white text-sky-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Compose Article</span>
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "manage" ? "bg-white text-sky-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Articles List ({posts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "logs" ? "bg-white text-sky-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live telemetry NOC</span>
          </button>
        </div>
      </div>

      {/* Main Tab Blocks */}
      {activeTab === "write" && (
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4.5 h-4.5 text-slate-700" />
              <h3 className="font-sans font-bold text-slate-800 text-sm">Synchronize Article to Website Databank</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">Presets:</span>
              <button
                onClick={() => fillQuickFormTemplate("postmortem")}
                className="text-[9px] font-mono hover:bg-slate-100 border border-slate-200 text-slate-600 py-0.5 px-2 rounded transition cursor-pointer"
              >
                Postmortem
              </button>
              <button
                onClick={() => fillQuickFormTemplate("bgp")}
                className="text-[9px] font-mono hover:bg-slate-100 border border-slate-200 text-slate-600 py-0.5 px-2 rounded transition cursor-pointer"
              >
                BGP Prepend
              </button>
            </div>
          </div>

          <form onSubmit={handleManualPublish} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Post Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      // Auto-generated slug ids
                      setSlug(e.target.value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, ""));
                    }}
                    className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-sans"
                    placeholder="e.g. Advanced Routing Policies with MPLS forwarding"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Database Slug Identifier</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-mono"
                    placeholder="e.g. mpls-routing-policies"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Short Abstract / Summary</label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-sans"
                  placeholder="Summary used for post index card overview..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-mono"
                    placeholder="e.g. BGP, MPLS, Routing"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Embed Lab Sandbox Widget</label>
                  <select
                    value={widgetType}
                    onChange={(e) => setWidgetType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-mono bg-white"
                  >
                    <option value="none">No Interactive Widget</option>
                    <option value="subnet">Subnet Range Bit-Calculator</option>
                    <option value="bgp-sim">AS Multihomed BGP Path Simulator</option>
                    <option value="config-translator">Cisco-to-Juniper Translator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Author Identity</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-sans"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Article Markdown Narrative</label>
                  <span className="text-[10px] font-mono text-slate-400">Fenced blocks & headers supported</span>
                </div>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full border border-slate-200 rounded p-3 text-xs text-slate-800 focus:outline-none focus:border-sky-500 h-64 font-mono leading-relaxed"
                  placeholder="# Article Heading\n\nContent details mapping routing configuration examples...\n"
                />
              </div>

              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs font-mono text-red-800 rounded flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 bg-emerald-55 text-emerald-800 bg-emerald-50 border border-emerald-200 text-xs font-sans rounded flex gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-850 text-white font-mono text-xs px-5 py-2 rounded-lg font-bold transition flex items-center gap-2 cursor-pointer border-none"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish and Update DB</span>
                </button>
              </div>

            </form>
          </div>
        )
      }

      {activeTab === "manage" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-sans font-bold text-slate-800 text-base">Historical Network Documentation Database</h3>
            <p className="text-xs text-slate-400">Review and remove published entries directly in posts-db.json</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="p-3">Title</th>
                  <th className="p-3">Slug ID</th>
                  <th className="p-3">Sandbox Widget</th>
                  <th className="p-3">Author</th>
                  <th className="p-3 text-center">Operation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/50 text-slate-700 transition">
                    <td className="p-3 font-semibold text-slate-900 font-sans max-w-sm truncate">{post.title}</td>
                    <td className="p-3 select-all text-sky-600">{post.id}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                        {post.widgetType}
                      </span>
                    </td>
                    <td className="p-3">{post.author}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Do you really want to delete networking post "${post.title}"?`)) {
                            onDeletePost(post.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition cursor-pointer"
                        title="Delete article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-sans font-bold text-slate-800 text-sm">Real-time syslog client network operations (NOC Mode)</h3>
            <p className="text-xs text-slate-400">Assists with gathering log information context for troubleshooting blog posts.</p>
          </div>
          <SyslogNocPanel />
        </div>
      )}

    </div>
  );
}
