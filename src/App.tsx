/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { PromptForm } from './components/PromptForm';
import { OutputView } from './components/OutputView';
import { AIScoreChecker } from './components/AIScoreChecker';
import { PROMPTS } from './constants';
import { generateAcademicResponse } from './services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { FlaskConical } from 'lucide-react';

export default function App() {
  const [selectedPromptId, setSelectedPromptId] = useState(PROMPTS[0].id);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedPrompt = PROMPTS.find(p => p.id === selectedPromptId) || PROMPTS[0];

  const handleGenerate = async (values: Record<string, string | number>) => {
    setIsLoading(true);
    setOutput('');

    try {
      const promptText = selectedPrompt.promptTemplate(values);
      await generateAcademicResponse(
        selectedPrompt.systemInstruction,
        promptText,
        (chunk) => {
          setOutput(prev => prev + chunk);
        }
      );
    } catch (error) {
      setOutput('An error occurred while consulting the academic model. Please ensure your GEMINI_API_KEY is configured correctly.');
    } finally {
      setIsLoading(false);
    }
  };

  const isAIScoreChecker = selectedPromptId === 'ai-score-checker';

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f9ff]">
      <Sidebar
        selectedPromptId={selectedPromptId}
        onSelectPrompt={(id) => {
          setSelectedPromptId(id);
          setOutput('');
        }}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-sky-100 px-8 flex items-center justify-between bg-white/70 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest font-bold text-sky-400">
              Active Tool
            </span>
            <div className="h-3.5 w-px bg-sky-200" />
            <span className="text-sm font-semibold text-sky-800">{selectedPrompt.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5">
              {['J', 'A', 'K'].map((letter, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                  style={{
                    background: i === 0 ? '#0ea5e9' : i === 1 ? '#ec4899' : '#0284c7',
                  }}
                >
                  {letter}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-pink-400">
                Peer Review Active
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden p-6 gap-6">
          <AnimatePresence mode="wait">
            {isAIScoreChecker ? (
              <motion.div
                key="ai-checker"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.25 }}
                className="w-full overflow-y-auto custom-scrollbar"
              >
                <AIScoreChecker />
              </motion.div>
            ) : (
              <motion.div
                key="standard-tool"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 gap-6 w-full"
              >
                <div className="w-[400px] flex-shrink-0 overflow-y-auto custom-scrollbar pr-1">
                  <PromptForm
                    prompt={selectedPrompt}
                    onGenerate={handleGenerate}
                    isLoading={isLoading}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <OutputView content={output} isLoading={isLoading} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
