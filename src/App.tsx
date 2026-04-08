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

export default function App() {
  const [selectedPromptId, setSelectedPromptId] = useState(PROMPTS[0].id);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedPrompt = PROMPTS.find(p => p.id === selectedPromptId) || PROMPTS[0];

  const handleGenerate = async (values: Record<string, any>) => {
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
      setOutput('An error occurred while consulting the academic model. Please ensure your API key is configured correctly.');
    } finally {
      setIsLoading(false);
    }
  };

  const isAIScoreChecker = selectedPromptId === 'ai-score-checker';

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f2ed]">
      <Sidebar 
        selectedPromptId={selectedPromptId} 
        onSelectPrompt={(id) => {
          setSelectedPromptId(id);
          setOutput('');
        }} 
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[#1a1a1a]/5 px-8 flex items-center justify-between bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#1a1a1a]/40">Current Tool</span>
            <div className="h-4 w-px bg-[#1a1a1a]/10" />
            <span className="text-sm font-medium text-[#1a1a1a]">{selectedPrompt.title}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-[#1a1a1a]/10 flex items-center justify-center text-[8px] font-bold">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#1a1a1a]/40">Peer Review Active</span>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden p-8 gap-8">
          <AnimatePresence mode="wait">
            {isAIScoreChecker ? (
              <motion.div
                key="ai-checker"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <AIScoreChecker />
              </motion.div>
            ) : (
              <motion.div
                key="standard-tool"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 gap-8 w-full"
              >
                <div className="w-[400px] flex-shrink-0">
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
