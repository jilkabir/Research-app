import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Shield, AlertTriangle, CheckCircle2, Play, RefreshCw, Loader2, Sparkles } from 'lucide-react';
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

export function AIScoreChecker() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkScore = async (inputText: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await response.json();
      
      if (response.ok && data.data) {
        setResult(data.data);
      } else {
        setError(data.error || "Unexpected API response from detection service.");
        setResult(null);
      }
    } catch (err) {
      setError("Failed to connect to the detection service. Please try again later.");
      console.error("Detection Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHumanize = async () => {
    if (!text) return;
    setIsHumanizing(true);
    try {
      const systemInstruction = 'You are a senior academic writing consultant. Rewrite the provided text to sound more human while maintaining all facts and citations. Rules: mix sentence lengths (8-35 words), remove robotic transitions (Furthermore, Moreover, Additionally), add natural hedging (suggests, appears to, indicates).';
      const prompt = `Rewrite this text with these rules:
- Mix sentence lengths 8 to 35 words
- Remove robotic transitions: Furthermore, Moreover, Additionally
- Add natural hedging: suggests, appears to, indicates
- Keep all facts and citations unchanged

Text: ${text}`;

      const humanizedText = await generateAcademicResponse(systemInstruction, prompt);
      setText(humanizedText);
      await checkScore(humanizedText);
    } catch (error) {
      console.error("Humanization Error:", error);
    } finally {
      setIsHumanizing(false);
    }
  };

  const getVerdict = (score: number) => {
    if (score < 20) return { label: 'Likely Human', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: <CheckCircle2 className="w-4 h-4" /> };
    if (score < 60) return { label: 'Mixed Content', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertTriangle className="w-4 h-4" /> };
    return { label: 'Likely AI', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <Shield className="w-4 h-4" /> };
  };

  const verdict = result ? getVerdict(result.fakePercentage) : null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-medium text-[#1a1a1a]">AI Score Checker</h2>
        <p className="text-sm text-[#1a1a1a]/60">Detect AI-generated content and humanize it for academic integrity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-[#1a1a1a]/40">
              Text to Analyze
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here..."
              className="w-full min-h-[300px] p-4 bg-white border border-[#1a1a1a]/10 rounded-xl text-sm focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none transition-all resize-none shadow-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => checkScore(text)}
              disabled={isLoading || !text}
              className={cn(
                "flex-1 py-3 px-6 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300",
                isLoading || !text
                  ? "bg-[#1a1a1a]/5 text-[#1a1a1a]/40 cursor-not-allowed"
                  : "bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] active:scale-[0.98] shadow-lg shadow-black/10"
              )}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Check AI Score
            </button>

            {result && result.fakePercentage > 20 && (
              <button
                onClick={handleHumanize}
                disabled={isHumanizing}
                className={cn(
                  "flex-1 py-3 px-6 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 border-2",
                  isHumanizing
                    ? "bg-amber-50 border-amber-200 text-amber-400 cursor-not-allowed"
                    : "bg-white border-amber-400 text-amber-600 hover:bg-amber-50 active:scale-[0.98]"
                )}
              >
                {isHumanizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Auto Humanize
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold">Detection Failed</p>
                <p className="text-xs opacity-80">{error}</p>
                {error.includes('ZEROGPT_API_KEY') && (
                  <p className="text-[10px] mt-2 font-medium bg-red-100 px-2 py-1 rounded inline-block">
                    Tip: Add your key in the Secrets panel.
                  </p>
                )}
              </div>
            </div>
          )}

          {result ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className={cn("p-6 rounded-2xl border-2 flex items-center justify-between", verdict?.bg, verdict?.border)}>
                <div className="space-y-1">
                  <div className={cn("flex items-center gap-2 font-bold text-lg", verdict?.color)}>
                    {verdict?.icon}
                    {verdict?.label}
                  </div>
                  <p className="text-xs opacity-60">Confidence in detection</p>
                </div>
                <div className="text-right">
                  <div className={cn("text-4xl font-serif font-bold", verdict?.color)}>
                    {Math.round(result.fakePercentage)}%
                  </div>
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">AI Score</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#1a1a1a]/40 px-1">Sentence Breakdown</h3>
                <div className="bg-white border border-[#1a1a1a]/10 rounded-2xl overflow-hidden shadow-sm max-h-[400px] overflow-y-auto custom-scrollbar">
                  {result.sentences.map((s, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "p-4 text-sm border-b border-[#1a1a1a]/5 last:border-0 transition-colors",
                        s.aiProbability > 50 ? "bg-red-50/30 hover:bg-red-50/50" : "hover:bg-[#1a1a1a]/[0.02]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                          s.aiProbability > 50 ? "bg-red-400" : "bg-green-400"
                        )} />
                        <p className="flex-1 leading-relaxed text-[#1a1a1a]/80">{s.sentence}</p>
                        <span className={cn(
                          "text-[10px] font-mono px-1.5 py-0.5 rounded",
                          s.aiProbability > 50 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                        )}>
                          {Math.round(s.aiProbability)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-[#1a1a1a]/5 rounded-2xl bg-[#1a1a1a]/[0.02] min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-[#1a1a1a]/5 flex items-center justify-center mb-4">
                <RefreshCw className="w-8 h-8 text-[#1a1a1a]/20" />
              </div>
              <h3 className="text-lg font-serif font-medium text-[#1a1a1a]/60">Awaiting Analysis</h3>
              <p className="text-sm text-[#1a1a1a]/40 max-w-xs mt-2">
                Paste your academic text and click check to see the AI probability score and sentence breakdown.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
