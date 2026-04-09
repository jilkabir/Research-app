import React from 'react';
import { PROMPTS } from '../constants';
import { cn } from '../lib/utils';
import {
  Search,
  FileText,
  PenTool,
  CheckCircle,
  Layout,
  BookOpen,
  Hash,
  RefreshCw,
  Maximize2,
  Link2,
  ChevronRight,
  FlaskConical,
} from 'lucide-react';

interface SidebarProps {
  selectedPromptId: string;
  onSelectPrompt: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Research: <Search className="w-4 h-4" />,
  Drafting: <FileText className="w-4 h-4" />,
  Refinement: <PenTool className="w-4 h-4" />,
  Formatting: <CheckCircle className="w-4 h-4" />,
  'Quality Check': <RefreshCw className="w-4 h-4" />,
};

export function Sidebar({ selectedPromptId, onSelectPrompt }: SidebarProps) {
  const categories = Array.from(new Set(PROMPTS.map(p => p.category)));

  return (
    <div className="w-72 h-screen jak-sidebar text-white flex flex-col border-r border-white/10 overflow-hidden shadow-xl">
      {/* Logo / Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-400/20 border border-pink-300/30 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-pink-300" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-semibold tracking-tight text-white leading-tight">
              Jak Research
            </h1>
            <p className="text-[9px] uppercase tracking-[0.22em] text-sky-300/70 font-sans mt-0.5">
              Academic Writing Suite
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 sidebar-scrollbar">
        {categories.map(category => (
          <div key={category} className="space-y-1">
            <div className="flex items-center gap-2 px-2 mb-2">
              <span className="text-pink-300/70">{CATEGORY_ICONS[category]}</span>
              <h2 className="text-[9px] uppercase tracking-[0.22em] font-bold text-sky-300/60">
                {category}
              </h2>
            </div>
            <div className="space-y-0.5">
              {PROMPTS.filter(p => p.category === category).map(prompt => (
                <button
                  key={prompt.id}
                  onClick={() => onSelectPrompt(prompt.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-between group",
                    selectedPromptId === prompt.id
                      ? "bg-pink-400/20 text-pink-100 border border-pink-300/20"
                      : "text-sky-100/60 hover:text-sky-50 hover:bg-white/8"
                  )}
                >
                  <span className="truncate font-medium">{prompt.title}</span>
                  <ChevronRight className={cn(
                    "w-3 h-3 flex-shrink-0 transition-all duration-200",
                    selectedPromptId === prompt.id
                      ? "opacity-100 text-pink-300 translate-x-0"
                      : "opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0"
                  )} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 bg-black/15">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-sky-400 flex items-center justify-center text-white text-xs font-bold shadow">
            J
          </div>
          <div>
            <p className="text-xs font-semibold text-white/90">Jak Consultant</p>
            <p className="text-[10px] text-sky-300/60">PhD Supervision Mode</p>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" title="Active" />
        </div>
      </div>
    </div>
  );
}
