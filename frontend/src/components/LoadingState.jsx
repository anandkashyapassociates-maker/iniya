import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading...', fullPage = false }) {
  if (fullPage) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 animate-ping absolute"></div>
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-400 tracking-wide">{message}</p>
      </div>
    );
  }

  return (
    <div className="py-12 flex flex-col items-center justify-center text-slate-500">
      <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-2" />
      <p className="text-xs font-medium text-slate-400">{message}</p>
    </div>
  );
}

