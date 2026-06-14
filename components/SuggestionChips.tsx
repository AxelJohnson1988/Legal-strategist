import React from 'react';
import { Suggestion } from '../types';

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onSelect: (text: string) => void; // In a voice app, this might just copy to clipboard or flash a "Say this" prompt
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onSelect }) => {
  return (
    <div className="w-full max-w-2xl flex flex-wrap gap-3 justify-center">
      {suggestions.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.text)}
          className="bg-gray-900/80 border border-gray-700 hover:border-indigo-500 hover:bg-gray-800 text-gray-300 text-sm px-4 py-3 rounded-xl transition-all duration-200 text-left backdrop-blur-sm group"
        >
          <span className="block font-medium text-indigo-400 text-xs mb-1 uppercase tracking-wider">{s.category}</span>
          <span className="group-hover:text-white">{s.text}</span>
        </button>
      ))}
    </div>
  );
};