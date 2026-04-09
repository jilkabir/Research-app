import React, { useState, useEffect } from 'react';
import { type PromptDefinition } from '../constants';
import { cn } from '../lib/utils';
import { Play, Loader2, AlertCircle } from 'lucide-react';

interface PromptFormProps {
  prompt: PromptDefinition;
  onGenerate: (values: Record<string, string | number>) => void;
  isLoading: boolean;
}

export function PromptForm({ prompt, onGenerate, isLoading }: PromptFormProps) {
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const defaults: Record<string, string | number> = {};
    prompt.inputs.forEach(input => {
      if (input.defaultValue !== undefined) {
        defaults[input.id] = input.defaultValue;
      } else {
        defaults[input.id] = '';
      }
    });
    setValues(defaults);
    setErrors({});
  }, [prompt]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    prompt.inputs.forEach(input => {
      const val = values[input.id];
      if (val === undefined || val === '') {
        newErrors[input.id] = `${input.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onGenerate(values);
  };

  const baseInput = "w-full p-3 bg-white border rounded-lg text-sm outline-none transition-all duration-200";
  const normalBorder = "border-sky-200 focus:ring-2 focus:ring-pink-200 focus:border-pink-400";
  const errorBorder = "border-red-300 focus:ring-2 focus:ring-red-100 focus:border-red-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl" noValidate>
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-semibold text-sky-900">{prompt.title}</h2>
        <p className="text-sm text-sky-600/80">{prompt.description}</p>
      </div>

      <div className="space-y-4">
        {prompt.inputs.map(input => (
          <div key={input.id} className="space-y-1.5">
            <label htmlFor={input.id} className="text-[10px] uppercase tracking-wider font-bold text-sky-500">
              {input.label}
            </label>

            {input.type === 'textarea' ? (
              <textarea
                id={input.id}
                value={(values[input.id] as string) || ''}
                onChange={e => {
                  setValues(prev => ({ ...prev, [input.id]: e.target.value }));
                  if (errors[input.id]) setErrors(prev => ({ ...prev, [input.id]: '' }));
                }}
                placeholder={input.placeholder}
                className={cn(
                  baseInput,
                  errors[input.id] ? errorBorder : normalBorder,
                  "min-h-[120px] resize-y"
                )}
              />
            ) : input.type === 'select' ? (
              <select
                id={input.id}
                value={(values[input.id] as string) || ''}
                onChange={e => {
                  setValues(prev => ({ ...prev, [input.id]: e.target.value }));
                  if (errors[input.id]) setErrors(prev => ({ ...prev, [input.id]: '' }));
                }}
                className={cn(
                  baseInput,
                  errors[input.id] ? errorBorder : normalBorder,
                  "appearance-none cursor-pointer"
                )}
              >
                <option value="">Select an option...</option>
                {input.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                id={input.id}
                type={input.type}
                value={(values[input.id] as string | number) ?? ''}
                onChange={e => {
                  const val = input.type === 'number' ? Number(e.target.value) : e.target.value;
                  setValues(prev => ({ ...prev, [input.id]: val }));
                  if (errors[input.id]) setErrors(prev => ({ ...prev, [input.id]: '' }));
                }}
                placeholder={input.placeholder}
                className={cn(baseInput, errors[input.id] ? errorBorder : normalBorder)}
              />
            )}

            {errors[input.id] && (
              <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {errors[input.id]}
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "w-full py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]",
          isLoading
            ? "bg-sky-100 text-sky-400 cursor-not-allowed"
            : "jak-btn-primary"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        {isLoading ? "Generating..." : "Generate Scholarly Output"}
      </button>
    </form>
  );
}
