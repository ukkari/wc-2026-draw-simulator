import React, { useState } from 'react';
import { Group, Team } from '../types';
import { MOCK_FLAGS } from '../constants';
import { analyzeGroup } from '../services/geminiService';
import { motion } from 'framer-motion';

interface GroupCardProps {
  group: Group;
  highlight: boolean;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, highlight }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const handleAnalyze = async () => {
    if (analysis) return;
    setLoadingAnalysis(true);
    const result = await analyzeGroup(group);
    setAnalysis(result);
    setLoadingAnalysis(false);
  };

  return (
    <motion.div 
      layout
      className={`relative flex flex-col bg-slate-800 border ${highlight ? 'border-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.3)]' : 'border-slate-700'} rounded-lg overflow-hidden min-h-[220px] transition-colors duration-300`}
    >
      <div className="bg-slate-900 p-3 flex justify-between items-center border-b border-slate-700">
        <h3 className="font-bold text-xl text-white">Group {group.name}</h3>
        {group.teams.length === 4 && (
          <button 
            onClick={handleAnalyze}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition"
            disabled={loadingAnalysis}
          >
            {loadingAnalysis ? '...' : 'AI'}
          </button>
        )}
      </div>
      
      <div className="p-3 flex-grow space-y-2">
        {[0, 1, 2, 3].map((idx) => {
          const team = group.teams[idx];
          return (
            <div 
              key={idx} 
              className={`flex items-center p-2 rounded ${team ? 'bg-slate-700/50' : 'bg-slate-800/50 border border-slate-700/30 border-dashed'} h-10`}
            >
              {team ? (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 w-full"
                >
                  <span className="text-lg select-none">{MOCK_FLAGS[team.name]}</span>
                  <span className="font-medium text-sm truncate text-slate-100">{team.name}</span>
                </motion.div>
              ) : (
                <span className="text-slate-600 text-xs w-full text-center">Pot {idx + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      {analysis && (
        <div className="absolute inset-0 bg-slate-900/95 p-4 flex flex-col justify-center items-center text-center z-30 cursor-pointer" onClick={() => setAnalysis(null)}>
          <p className="text-xs text-teal-400 font-bold mb-1">GEMINI ANALYSIS</p>
          <p className="text-sm text-slate-200 italic leading-relaxed">"{analysis}"</p>
          <span className="text-[10px] text-slate-500 mt-2">(Click to close)</span>
        </div>
      )}
    </motion.div>
  );
};

export default GroupCard;