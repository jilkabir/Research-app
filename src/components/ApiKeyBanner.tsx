import { AlertTriangle, X, KeyRound } from 'lucide-react';
import { useState } from 'react';

const PLACEHOLDER = 'MY_GEMINI_API_KEY';

export function ApiKeyBanner() {
  const [dismissed, setDismissed] = useState(false);

  const apiKey = process.env.GEMINI_API_KEY || '';
  const isMissing = !apiKey || apiKey === PLACEHOLDER || apiKey.length < 10;

  if (!isMissing || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3">
      <div className="flex items-center gap-2 flex-1">
        <KeyRound className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800 font-medium">
          Gemini API key not configured.{' '}
          <span className="font-normal text-amber-700">
            Add your key to the{' '}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">.env</code>
            {' '}file:{' '}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">
              GEMINI_API_KEY=your-key-here
            </code>
            , then restart the server.
            {' '}Get a free key at{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-800 hover:text-amber-900"
            >
              aistudio.google.com
            </a>
          </span>
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-amber-100 rounded-lg transition-colors text-amber-600 flex-shrink-0"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
