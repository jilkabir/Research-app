import { AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function ApiKeyBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    // Ping the academic endpoint with an empty prompt to check if the key is configured.
    // A 500 with "not configured" means the key is missing; any other response means it's set.
    fetch('/api/academic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemInstruction: '', prompt: 'ping' }),
    })
      .then(async (res) => {
        if (res.status === 500) {
          const data = await res.json().catch(() => ({}));
          if (String(data.error).includes('not configured')) setMissing(true);
        }
      })
      .catch(() => { /* network error — don't show banner */ });
  }, []);

  if (!missing || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3">
      <div className="flex items-center gap-2 flex-1">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800 font-medium">
          Gemini API key not configured.{' '}
          <span className="font-normal text-amber-700">
            Add{' '}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">
              GEMINI_API_KEY
            </code>
            {' '}to your Vercel environment variables, then redeploy. Get a free key at{' '}
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
