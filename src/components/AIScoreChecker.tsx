import React, { useState } from 'react';
import { cn } from '../lib/utils';
import {
  Shield, AlertTriangle, CheckCircle2, Play, RefreshCw,
  Loader2, Sparkles, Brain, ChevronDown, ChevronUp, Copy, Check,
} from 'lucide-react';
import { generateAcademicResponse, generateJSON } from '../services/gemini';

// ── Types ────────────────────────────────────────────────────────────────────

interface SentenceResult {
  text: string;
  score: number;       // 0–100 AI probability
  reason: string;      // short reason
}

interface DetectionPattern {
  label: string;
  severity: 'high' | 'medium' | 'low';
}

interface AnalysisResult {
  overallScore: number;          // 0–100
  verdict: string;               // e.g. "Likely AI-Generated"
  summary: string;               // 2-3 sentence plain-English summary
  patterns: DetectionPattern[];  // writing patterns detected
  sentences: SentenceResult[];   // per-sentence breakdown
}

// ── Gemini AI Detector ───────────────────────────────────────────────────────

const DETECTION_SYSTEM = `You are an expert AI-content detection system trained to identify AI-generated academic text.
You analyse writing patterns with high accuracy and always return valid JSON.`;

const detectionPrompt = (text: string) => `
Analyse the following academic text for signs of AI generation.

Scoring guide:
• 0–19  → Almost certainly human-written
• 20–49 → Likely human with some AI traits
• 50–74 → Mixed — possibly AI-assisted
• 75–89 → Likely AI-generated
• 90–100 → Almost certainly AI-generated

Patterns to look for (each raises the AI score):
- Uniform sentence length and rhythm
- Robotic transitions: "Furthermore", "Moreover", "Additionally", "In conclusion", "It is worth noting"
- Vague, hedging openers: "It is important to…", "This paper aims to…"
- Missing personal voice, anecdotes, or field-specific nuance
- Perfect paragraph structure with no variation
- Over-reliance on passive voice

Return ONLY this JSON (no markdown, no extra text):
{
  "overallScore": <integer 0-100>,
  "verdict": "<one of: Likely Human | Possibly Human | Mixed Content | Likely AI | Almost Certainly AI>",
  "summary": "<2-3 sentences describing the overall assessment in plain English>",
  "patterns": [
    { "label": "<pattern name>", "severity": "<high|medium|low>" }
  ],
  "sentences": [
    { "text": "<exact sentence>", "score": <integer 0-100>, "reason": "<very short reason, max 8 words>" }
  ]
}

Text to analyse:
"""
${text}
"""`;

async function detectAI(text: string): Promise<AnalysisResult> {
  const result = await generateJSON<AnalysisResult>(DETECTION_SYSTEM, detectionPrompt(text));

  // Validate shape
  if (typeof result.overallScore !== 'number' || !Array.isArray(result.sentences)) {
    throw new Error('Unexpected response format from AI detector.');
  }
  // Clamp score
  result.overallScore = Math.max(0, Math.min(100, Math.round(result.overallScore)));
  return result;
}

// ── Verdict config ───────────────────────────────────────────────────────────

function getVerdict(score: number) {
  if (score < 20) return {
    label: 'Likely Human',
    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',
    bar: 'bg-emerald-400', icon: <CheckCircle2 className="w-5 h-5" />,
  };
  if (score < 50) return {
    label: 'Possibly Human',
    color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200',
    bar: 'bg-teal-400', icon: <CheckCircle2 className="w-5 h-5" />,
  };
  if (score < 75) return {
    label: 'Mixed Content',
    color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200',
    bar: 'bg-amber-400', icon: <AlertTriangle className="w-5 h-5" />,
  };
  return {
    label: 'Likely AI-Generated',
    color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200',
    bar: 'bg-red-400', icon: <Shield className="w-5 h-5" />,
  };
}

const SEVERITY_STYLE: Record<string, string> = {
  high:   'bg-red-100 text-red-700 border border-red-200',
  medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  low:    'bg-sky-100 text-sky-700 border border-sky-200',
};

// ── Component ────────────────────────────────────────────────────────────────

export function AIScoreChecker() {
  const [text, setText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCheck = async (inputText = text) => {
    if (!inputText.trim()) return;
    setIsChecking(true);
    setError(null);
    setResult(null);
    setShowAll(false);
    try {
      const data = await detectAI(inputText);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detection failed. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleHumanize = async () => {
    if (!text.trim()) return;
    setIsHumanizing(true);
    setError(null);
    try {
      const system = 'You are a senior academic writing consultant. Rewrite the text to sound natural and human. Mix sentence lengths (8–35 words), remove robotic transitions, add natural hedging, keep all facts and citations.';
      const prompt = `Rewrite this text to sound more human-written. Keep all facts and citations unchanged.\n\nText:\n${text}`;
      const humanized = await generateAcademicResponse(system, prompt);
      if (humanized) {
        setText(humanized);
        await handleCheck(humanized);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Humanization failed.');
    } finally {
      setIsHumanizing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const verdict = result ? getVerdict(result.overallScore) : null;
  const visibleSentences = showAll ? result?.sentences : result?.sentences.slice(0, 5);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-pink-400" />
          <h2 className="text-2xl font-serif font-semibold text-sky-900">AI Score Checker</h2>
        </div>
        <p className="text-sm text-sky-500/80">
          Powered by Gemini AI — analyses writing patterns to detect AI-generated academic content.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Left: Input ── */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-wider font-bold text-sky-500">
                Text to Analyze
              </label>
              {wordCount > 0 && (
                <span className="text-[10px] text-sky-400">
                  {wordCount} words · {text.length} chars
                </span>
              )}
            </div>
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => { setText(e.target.value); setResult(null); setError(null); }}
                placeholder="Paste your academic text here to check if it was AI-generated..."
                className="w-full min-h-[320px] p-4 bg-white border border-sky-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none transition-all resize-none shadow-sm text-sky-900 placeholder:text-sky-300"
              />
              {text && (
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-400 hover:text-sky-600 transition-colors"
                  title="Copy text"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleCheck()}
              disabled={isChecking || !text.trim()}
              className={cn(
                "flex-1 py-3 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]",
                isChecking || !text.trim()
                  ? "bg-sky-100 text-sky-400 cursor-not-allowed"
                  : "jak-btn-primary"
              )}
            >
              {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isChecking ? 'Analysing...' : 'Check AI Score'}
            </button>

            {result && result.overallScore > 30 && (
              <button
                onClick={handleHumanize}
                disabled={isHumanizing}
                className={cn(
                  "flex-1 py-3 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]",
                  isHumanizing
                    ? "bg-pink-100 text-pink-400 cursor-not-allowed"
                    : "jak-btn-pink"
                )}
              >
                {isHumanizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isHumanizing ? 'Rewriting...' : 'Auto Humanize'}
              </button>
            )}
          </div>

          {/* Tip */}
          {!result && !isChecking && (
            <p className="text-[11px] text-sky-400/70 leading-relaxed">
              Tip: Works best with 100+ words. The more text you provide, the more accurate the analysis.
            </p>
          )}
        </div>

        {/* ── Right: Results ── */}
        <div className="space-y-5">

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-600">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold mb-0.5">Detection Failed</p>
                <p className="text-xs leading-relaxed opacity-80">{error}</p>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {isChecking && (
            <div className="space-y-4 animate-pulse">
              <div className="h-32 bg-sky-100 rounded-2xl" />
              <div className="h-4 bg-sky-50 rounded-lg w-1/3" />
              <div className="space-y-2">
                <div className="h-14 bg-sky-50 rounded-xl" />
                <div className="h-14 bg-sky-50 rounded-xl" />
                <div className="h-14 bg-sky-50 rounded-xl" />
              </div>
            </div>
          )}

          {/* Results */}
          {result && !isChecking && (
            <div className="space-y-5">

              {/* Score card */}
              <div className={cn("p-6 rounded-2xl border-2", verdict?.bg, verdict?.border)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <div className={cn("flex items-center gap-2 font-bold text-xl", verdict?.color)}>
                      {verdict?.icon}
                      {verdict?.label}
                    </div>
                    <p className="text-xs text-sky-600/70 max-w-[220px] leading-relaxed">
                      {result.summary}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className={cn("text-6xl font-serif font-bold leading-none tabular-nums", verdict?.color)}>
                      {result.overallScore}%
                    </div>
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mt-1">AI Score</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={cn("h-2.5 rounded-full transition-all duration-1000 ease-out", verdict?.bar)}
                    style={{ width: `${result.overallScore}%` }}
                  />
                </div>
              </div>

              {/* Detected patterns */}
              {result.patterns.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-sky-500 px-1">
                    Patterns Detected
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.patterns.map((p, i) => (
                      <span
                        key={i}
                        className={cn("text-xs font-medium px-3 py-1 rounded-full", SEVERITY_STYLE[p.severity])}
                      >
                        {p.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sentence breakdown */}
              {result.sentences.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-sky-500 px-1">
                    Sentence Breakdown
                  </h3>
                  <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-sm">
                    {visibleSentences?.map((s, i) => (
                      <div
                        key={i}
                        className={cn(
                          "p-4 border-b border-sky-50 last:border-0 transition-colors",
                          s.score >= 75 ? "bg-red-50/40 hover:bg-red-50/60"
                            : s.score >= 50 ? "bg-amber-50/30 hover:bg-amber-50/50"
                            : "hover:bg-sky-50/40"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0",
                            s.score >= 75 ? "bg-red-400"
                              : s.score >= 50 ? "bg-amber-400"
                              : "bg-emerald-400"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-relaxed text-sky-800">{s.text}</p>
                            {s.reason && (
                              <p className="text-[10px] text-sky-400 mt-1 italic">{s.reason}</p>
                            )}
                          </div>
                          <span className={cn(
                            "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5",
                            s.score >= 75 ? "bg-red-100 text-red-600"
                              : s.score >= 50 ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          )}>
                            {s.score}%
                          </span>
                        </div>
                      </div>
                    ))}

                    {result.sentences.length > 5 && (
                      <button
                        onClick={() => setShowAll(v => !v)}
                        className="w-full py-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-sky-500 hover:bg-sky-50 transition-colors"
                      >
                        {showAll
                          ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                          : <><ChevronDown className="w-3.5 h-3.5" /> Show {result.sentences.length - 5} more sentences</>}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!result && !error && !isChecking && (
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-sky-200 rounded-2xl bg-white/50 min-h-[380px]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-pink-100 flex items-center justify-center mb-4 shadow-sm">
                <Brain className="w-8 h-8 text-sky-400" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-sky-800">Ready to Analyse</h3>
              <p className="text-sm text-sky-400 max-w-xs mt-2 leading-relaxed">
                Paste academic text on the left and click <strong>Check AI Score</strong> to get a detailed breakdown powered by Gemini AI.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
