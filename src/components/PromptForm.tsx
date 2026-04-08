import React, { useState, useEffect } from 'react';
import { type PromptDefinition } from '../constants';
import { cn } from '../lib/utils';
import { Play, Loader2 } from 'lucide-react';

interface PromptFormProps {
  prompt: PromptDefinition;
  onGenerate: (values: Record<string, any>) => void;
  isLoading: boolean;
}

export function PromptForm({ prompt, onGenerate, isLoading }: PromptFormProps) {
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const defaults: Record<string, any> = {};
    prompt.inputs.forEach(input => {
      if (input.defaultValue !== undefined) {
        defaults[input.id] = input.defaultValue;
      }
    });
    setValues(defaults);
  }, [prompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-medium text-[#1a1a1a]">{prompt.title}</h2>
        <p className="text-sm text-[#1a1a1a]/60">{prompt.description}</p>
      </div>

      <div className="space-y-4">
        {prompt.inputs.map(input => (
          <div key={input.id} className="space-y-1.5">
            <label htmlFor={input.id} className="text-[10px] uppercase tracking-wider font-semibold text-[#1a1a1a]/40">
              {input.label}
            </label>
            
            {input.type === 'textarea' ? (
              <textarea
                id={input.id}
                value={values[input.id] || ''}
                onChange={e => setValues(prev => ({ ...prev, [input.id]: e.target.value }))}
                placeholder={input.placeholder}
                className="w-full min-h-[120px] p-3 bg-white border border-[#1a1a1a]/10 rounded-lg text-sm focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all resize-y"
                required
              />
            ) : input.type === 'select' ? (
              <select
                id={input.id}
                value={values[input.id] || ''}
                onChange={e => setValues(prev => ({ ...prev, [input.id]: e.target.value }))}
                className="w-full p-3 bg-white border border-[#1a1a1a]/10 rounded-lg text-sm focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all appearance-none"
                required
              >
                {input.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                id={input.id}
                type={input.type}
                value={values[input.id] || ''}
                onChange={e => setValues(prev => ({ ...prev, [input.id]: e.target.value }))}
                placeholder={input.placeholder}
                className="w-full p-3 bg-white border border-[#1a1a1a]/10 rounded-lg text-sm focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all"
                required
              />
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "w-full py-3 px-6 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300",
          isLoading 
            ? "bg-[#1a1a1a]/5 text-[#1a1a1a]/40 cursor-not-allowed" 
            : "bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] active:scale-[0.98] shadow-lg shadow-black/10"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        {isLoading ? "Consulting..." : "Generate Scholarly Output"}
      </button>
    </form>
  );
}
