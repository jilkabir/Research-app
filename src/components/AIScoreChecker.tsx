import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Shield, AlertTriangle, CheckCircle2, Play, RefreshCw, Loader2, Sparkles, Brain, Zap } from 'lucide-react';
import { generateAcademicResponse } from '../services/gemini';

interface Sentence {
  sentence: string;
  aiProbability: number;
}

interface DetectionResult {
  fakePercentage: number;
  sentences: Sentence[];
  isHuman: boolean;
  additional_feedback?: string;
}

type DetectionMethod = 'zerogpt' | 'gemini';

// ── Gemini-based fallback detector ──────────────────────────────────────────
async function detectWithGemini(inputText: string): Promise<DetectionResult> {
  const systemInstruction =
    'You are an expert AI-content detection model. Analyze the given text and return ONLY a valid JSON object — no markdown, no explanation, just raw JSON.';

  const prompt = `Analyze the following academic text for signs of AI generation.

Return ONLY this JSON structure (no extra text):
{
  "fakePercentage": <integer 0-100, how AI-generated the overall text feels>,
  "isHuman": <boolean, true if fakePercentage < 50>,
  "sentences": [
    { "sentence": "<exact sentence from text>", "aiProbability": <integer 0-100> }
  ]
}

Rules for scoring:
- Uniform sentence length → high AI probability
- Robotic transitions (Furthermore, Moreover, Additionally) → high AI probability
- Natural hedging, varied rhythm, personal framing → low AI probability
- Score each sentence individually before calculating the overall fakePercentage

Text to analyze:
"""
${inputText}
"""`;

  const raw = await generateAcademicResponse(systemInstruction, prompt);

  // Extract JSON from the response (strip any markdown fences if present)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Gemini returned an unexpected response format.');

  const parsed = JSON.parse(jsonMatch[0]) as DetectionResult;

  // Sanity-check the parsed object
  if (
    typeof parsed.fakePercentage !== 'number' ||
    !Array.isArray(parsed.sentences)
  ) {
    throw new Error('Gemini response did not match expected schema.');
  }

  return parsed;
}

// ── ZeroGPT detector via backend proxy ──────────────────────────────────────
async function detectWithZeroGPT(inputText: string): Promise<DetectionResult> {
  const response = await fetch('/api/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: inputText }),
  });

  const data = await response.json() as { data?: DetectionResult; error?: string };

  if (!response.ok || !data.data) {
    throw new Error(data.error || `ZeroGPT returned status ${response.status}`);
  }

  return data.data;
}

// ── Component ────────────────────────────────────────────────────────────────
export function AIScoreChecker() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [detectionMethod, setDetectionMethod] = useState<DetectionMethod | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkScore = async (inputText: string) => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    // 1. Try ZeroGPT first
    try {
      const data = await detectWithZeroGPT(inputText);
      setResult(data);
      setDetectionMethod('zerogpt');
      return;
    } catch {
      // ZeroGPT failed — silently fall through to Gemini
    }

    // 2. Fall back to Gemini
    try {
      const data = await detectWithGemini(inputText);
      setResult(data);
      setDetectionMethod('gemini');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Detection failed: ${msg}. Please ensure your GEMINI_API_KEY is set.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHumanize = async () => {
    if (!text.trim()) return;
    setIsHumanizing(true);
    setError(null);
    try {
      const systemInstruction =
        'You are a senior academic writing consultant. Rewrite the provided text to sound more human while maintaining all facts and citations. Rules: mix sentence lengths (8-35 words), remove robotic transitions (Furthermore, Moreover, Additionally), add natural hedging (suggests, appears to, indicates).';
      const prompt = `Rewrite this text with these rules:\n- Mix sentence lengths 8 to 35 words\n- Remove robotic transitions: Furthermore, Moreover, Additionally\n- Add natural hedging: suggests, appears to, indicates\n- Keep all facts and citations unchanged\n\nText: ${text}`;

      const humanizedText = await generateAcademicResponse(systemInstruction, prompt);
      if (humanizedText) {
        setText(humanizedText);
        await checkScore(humanizedText);
      }
    } catch {
      setError('Humanization failed. Please try again.');
    } finally {
      setIsHumanizing(false);
    }
  };

  const getVerdict = (score: number) => {
    if (score < 20) return {
      label: 'Likely Human',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      bar: 'bg-emerald-400',
      icon: <CheckCircle2 className="w-5 h-5" />,
    };
    if (score < 60) return {
      label: 'Mixed Content',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      bar: 'bg-amber-400',
      icon: <AlertTriangle className="w-5 h-5" />,
    };
    return {
      label: 'Likely AI',
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      bar: 'bg-red-400',
      icon: <Shield className="w-5 h-5" />,
    };
  };

  const verdict = result ? getVerdict(result.fakePercentage) : null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-semibold text-sky-900">AI Score Checker</h2>
        <p className="text-sm text-sky-500/80">
          Detect AI-generated content and humanize it for academic integrity.
          Uses ZeroGPT when available, falls back to Gemini automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-sky-500">
              Text to Analyze
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here to analyze for AI content..."
              className="w-full min-h-[300px] p-4 bg-white border border-sky-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-200 focus:border-pink-400 outline-none transition-all resize-none shadow-sm text-sky-900 placeholder:text-sky-300"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => checkScore(text)}
              disabled={isLoading || !text.trim()}
              className={cn(
                "flex-1 py-3 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]",
                isLoading || !text.trim()
                  ? "bg-sky-100 text-sky-400 cursor-not-allowed"
                  : "jak-btn-primary"
              )}
            >
              {isLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Play className="w-4 h-4" />}
              {isLoading ? 'Analyzing...' : 'Check AI Score'}
            </button>

            {result && result.fakePercentage > 20 && (
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
                {isHumanizing
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Sparkles className="w-4 h-4" />}
                {isHumanizing ? 'Rewriting...' : 'Auto Humanize'}
              </button>
            )}
          </div>

          {text.trim() && (
            <p className="text-[11px] text-sky-400 text-right">
              {text.trim().split(/\s+/).length} words · {text.length} characters
            </p>
          )}
        </div>

        {/* Right: Results */}
        <div className="space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-600">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold">Detection Failed</p>
                <p className="text-xs opacity-80">{error}</p>
              </div>
            </div>
          )}

          {result ? (
            <div className="space-y-5">
              {/* Score card */}
              <div className={cn("p-6 rounded-2xl border-2", verdict?.bg, verdict?.border)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1.5">
                    <div className={cn("flex items-center gap-2 font-bold text-lg", verdict?.color)}>
                      {verdict?.icon}
                      {verdict?.label}
                    </div>
                    {/* Detection method badge */}
                    <div className="flex items-center gap-1.5">
                      {detectionMethod === 'gemini' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-600">
                          <Brain className="w-3 h-3" /> Gemini AI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">
                          <Zap className="w-3 h-3" /> ZeroGPT
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-5xl font-serif font-bold leading-none", verdict?.color)}>
                      {Math.round(result.fakePercentage)}%
                    </div>
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mt-1">AI Score</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
                  <div
                    className={cn("h-2 rounded-full transition-all duration-700", verdict?.bar)}
                    style={{ width: `${Math.min(result.fakePercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Sentence breakdown */}
              {result.sentences.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-sky-500 px-1">
                    Sentence Breakdown
                  </h3>
                  <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-sm max-h-[380px] overflow-y-auto custom-scrollbar">
                    {result.sentences.map((s, i) => (
                      <div
                        key={i}
                        className={cn(
                          "p-4 text-sm border-b border-sky-50 last:border-0 transition-colors",
                          s.aiProbability > 50
                            ? "bg-red-50/40 hover:bg-red-50/70"
                            : "hover:bg-sky-50/50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0",
                            s.aiProbability > 50 ? "bg-red-400" : "bg-emerald-400"
                          )} />
                          <p className="flex-1 leading-relaxed text-sky-800">{s.sentence}</p>
                          <span className={cn(
                            "text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5",
                            s.aiProbability > 50
                              ? "bg-red-100 text-red-600"
                              : "bg-emerald-100 text-emerald-700"
                          )}>
                            {Math.round(s.aiProbability)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : !error && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-sky-200 rounded-2xl bg-white/50 min-h-[380px]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-pink-100 flex items-center justify-center mb-4 shadow-sm">
                <RefreshCw className="w-8 h-8 text-sky-400" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-sky-800">Awaiting Analysis</h3>
              <p className="text-sm text-sky-400 max-w-xs mt-2 leading-relaxed">
                Paste your academic text and click Check to see the AI probability score and sentence breakdown.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
