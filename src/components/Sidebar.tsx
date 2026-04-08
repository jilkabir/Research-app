import React from 'react';
import { PROMPTS, type PromptDefinition } from '../constants';
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
  ChevronRight
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
    <div className="w-72 h-screen bg-[#1a1a1a] text-white flex flex-col border-r border-white/10 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-serif font-medium tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-400" />
          ScholarSmith
        </h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1 font-sans">
          Academic Writing Suite
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
        {categories.map(category => (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2 px-2 mb-2">
              <span className="text-amber-400/60">{CATEGORY_ICONS[category]}</span>
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/40">
                {category}
              </h2>
            </div>
            <div className="space-y-1">
              {PROMPTS.filter(p => p.category === category).map(prompt => (
                <button
                  key={prompt.id}
                  onClick={() => onSelectPrompt(prompt.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 flex items-center justify-between group",
                    selectedPromptId === prompt.id 
                      ? "bg-white/10 text-white" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className="truncate">{prompt.title}</span>
                  <ChevronRight className={cn(
                    "w-3 h-3 transition-transform duration-200",
                    selectedPromptId === prompt.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                  )} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400 font-serif italic">
            P
          </div>
          <div>
            <p className="text-xs font-medium">Senior Consultant</p>
            <p className="text-[10px] text-white/40">PhD Supervision Mode</p>
          </div>
        </div>
      </div>
    </div>
  );
}
