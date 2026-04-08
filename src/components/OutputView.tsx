import ReactMarkdown from 'react-markdown';
import { Copy, Check, Download } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface OutputViewProps {
  content: string;
  isLoading: boolean;
}

export function OutputView({ content, isLoading }: OutputViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "scholar-smith-output.txt";
    document.body.appendChild(element);
    element.click();
  };

  if (!content && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-[#1a1a1a]/5 rounded-2xl bg-[#1a1a1a]/[0.02]">
        <div className="w-16 h-16 rounded-full bg-amber-400/10 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-amber-500/40" />
        </div>
        <h3 className="text-lg font-serif font-medium text-[#1a1a1a]/60">Ready for Consultation</h3>
        <p className="text-sm text-[#1a1a1a]/40 max-w-xs mt-2">
          Select a tool from the sidebar and provide the necessary details to generate academic content.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border border-[#1a1a1a]/10 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-[#1a1a1a]/10 flex items-center justify-between bg-[#1a1a1a]/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#1a1a1a]/40">Consultant Output</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-[#1a1a1a]/5 rounded-md transition-colors text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-[#1a1a1a]/5 rounded-md transition-colors text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
            title="Download as text"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 prose prose-sm prose-stone max-w-none custom-scrollbar">
        {isLoading && !content ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-[#1a1a1a]/5 rounded w-3/4" />
            <div className="h-4 bg-[#1a1a1a]/5 rounded w-full" />
            <div className="h-4 bg-[#1a1a1a]/5 rounded w-5/6" />
            <div className="h-4 bg-[#1a1a1a]/5 rounded w-2/3" />
          </div>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
