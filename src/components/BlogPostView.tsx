/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ReactMarkdown from "react-markdown";
import { BlogPost } from "../types";
import { ArrowLeft, User, Calendar, Tag, ShieldAlert, Cpu } from "lucide-react";
import CIDRCalculator from "./CIDRCalculator";
import BGPPathSimulator from "./BGPPathSimulator";
import VendorTranslator from "./VendorTranslator";

interface BlogPostViewProps {
  post: BlogPost;
  onBack: () => void;
}

export default function BlogPostView({ post, onBack }: BlogPostViewProps) {
  
  // Format dates elegantly
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  // Dynamically resolve embedded network widget
  const renderEmbeddedWidget = () => {
    switch (post.widgetType) {
      case "subnet":
        return (
          <div className="mt-8 pt-8 border-t border-slate-200">
            <div className="bg-slate-900 text-slate-100 p-4 rounded-t-xl border-x border-t border-slate-850 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider">Embedded Network Lab Sandbox</span>
            </div>
            <CIDRCalculator />
          </div>
        );
      case "bgp-sim":
        return (
          <div className="mt-8 pt-8 border-t border-slate-200">
            <div className="bg-slate-900 text-slate-100 p-4 rounded-t-xl border-x border-t border-slate-850 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider">Embedded Border Path Sandbox</span>
            </div>
            <BGPPathSimulator />
          </div>
        );
      case "config-translator":
        return (
          <div className="mt-8 pt-8 border-t border-slate-200">
            <div className="bg-slate-900 text-slate-100 p-4 rounded-t-xl border-x border-t border-slate-850 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-500" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider">Embedded CLI Translation Simulator</span>
            </div>
            <VendorTranslator />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      
      {/* Return button */}
      <button
        onClick={onBack}
        className="group flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Return to Portal Feed</span>
      </button>

      {/* Article Header Container */}
      <header className="space-y-4 mb-8">
        <h1 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-slate-900 select-all leading-tight">
          {post.title}
        </h1>
        
        {/* Post Metadata line */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-slate-500 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md text-slate-700">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>{post.author}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDate(post.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex gap-1">
              {post.tags.map((tag) => (
                <span key={tag} className="text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded transition">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Markdown Body Content */}
      <article className="prose prose-slate max-w-none prose-xs prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-800 prose-p:text-slate-600 prose-pre:bg-slate-900 prose-pre:text-slate-300 prose-pre:font-mono prose-code:text-sky-600 prose-code:bg-slate-50 prose-code:text-xs prose-code:p-1 prose-code:rounded prose-blockquote:border-l-4 prose-blockquote:border-slate-300 prose-blockquote:text-slate-500 prose-li:text-slate-600 selection:bg-teal-500/10">
        <div className="markdown-body leading-relaxed space-y-6">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </article>

      {/* Interactive Tool Widget (Simulators) Injection */}
      {renderEmbeddedWidget()}

    </div>
  );
}
