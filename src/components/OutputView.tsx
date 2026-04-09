import ReactMarkdown from 'react-markdown';
import { Copy, Check, Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface OutputViewProps {
  content: string;
  isLoading: boolean;
}

export function OutputView({ content, isLoading }: OutputViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement('textarea');
      el.value = content;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jak-research-output.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!content && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-sky-200 rounded-2xl bg-white/50">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-pink-100 flex items-center justify-center mb-4 shadow-sm">
          <FileText className="w-8 h-8 text-sky-400" />
        </div>
        <h3 className="text-lg font-serif font-semibold text-sky-800">Ready for Consultation</h3>
        <p className="text-sm text-sky-500/80 max-w-xs mt-2 leading-relaxed">
          Select a tool from the sidebar and provide the necessary details to generate academic content.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-md">
      {/* Toolbar */}
      <div className="px-6 py-3.5 border-b border-sky-100 flex items-center justify-between bg-sky-50/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse shadow-sm shadow-pink-300" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-sky-500">
            Jak Research Output
          </span>
        </div>
        {content && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              disabled={!content}
              className="p-2 hover:bg-sky-100 rounded-lg transition-colors text-sky-400 hover:text-sky-700"
              title="Copy to clipboard"
            >
              {copied
                ? <Check className="w-4 h-4 text-emerald-500" />
                : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownload}
              disabled={!content}
              className="p-2 hover:bg-sky-100 rounded-lg transition-colors text-sky-400 hover:text-sky-700"
              title="Download as text"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {isLoading && !content ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-5 bg-sky-100 rounded-lg w-3/4" />
            <div className="h-4 bg-sky-50 rounded-lg w-full" />
            <div className="h-4 bg-sky-50 rounded-lg w-5/6" />
            <div className="h-4 bg-sky-50 rounded-lg w-2/3" />
            <div className="h-4 bg-sky-50 rounded-lg w-full" />
            <div className="h-5 bg-sky-100 rounded-lg w-1/2 mt-6" />
            <div className="h-4 bg-sky-50 rounded-lg w-full" />
            <div className="h-4 bg-sky-50 rounded-lg w-4/5" />
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
