import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar, Sprout, Footprints, Lightbulb, Heart, Send, History, Clock } from 'lucide-react';
import { ThoughtCard, NextStepType, GrowthStage } from '../types';
import { MusicPlayer } from './MusicPlayer';

interface ReflectionModalProps {
  thought: ThoughtCard | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onWater?: (thought: ThoughtCard, update: string) => void;
}

const NextStepIcon = ({ type }: { type: NextStepType }) => {
  switch (type) {
    case 'do': return <Footprints size={18} className="text-teal-600" />;
    case 'clarify': return <Lightbulb size={18} className="text-amber-600" />;
    case 'reflect': return <Heart size={18} className="text-rose-600" />;
    default: return <Sprout size={18} className="text-stone-600" />;
  }
};

const NextStepLabel = ({ type }: { type: NextStepType }) => {
  switch (type) {
    case 'do': return <span className="text-teal-700">A small step</span>;
    case 'clarify': return <span className="text-amber-700">To clarify</span>;
    case 'reflect': return <span className="text-rose-700">To reflect</span>;
    default: return <span className="text-stone-700">Invitation</span>;
  }
};

export const ReflectionModal: React.FC<ReflectionModalProps> = ({ 
  thought, 
  onClose, 
  onDelete,
  onWater
}) => {
  const [waterInput, setWaterInput] = useState('');
  const [isWatering, setIsWatering] = useState(false);

  if (!thought) return null;

  const handleWaterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waterInput.trim() || !onWater || isWatering) return;
    
    setIsWatering(true);
    await onWater(thought, waterInput);
    setIsWatering(false);
    setWaterInput('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
        />
        
        {/* Modal Card - Redesigned to be single column/card style */}
        <motion.div 
          layoutId={thought.id}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          {/* Scrollable Content */}
          <div className="overflow-y-auto overflow-x-hidden flex-1 p-8 md:p-10">
            
            {/* Header: Phase Label */}
            <div className="flex justify-center mb-8">
               <span className="text-xs font-bold tracking-[0.2em] text-stone-400 uppercase">
                 {thought.growthStage} Phase
               </span>
            </div>

            {/* Hero Section: Image + Quote */}
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10 mb-10 w-full">
                {/* Circular Plant Image */}
                <div className="relative group flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-100 via-amber-100 to-rose-100 blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                    <motion.div 
                      layoutId={`image-${thought.id}`}
                      className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-white to-stone-50 border-[6px] border-white shadow-xl flex items-center justify-center overflow-hidden ring-1 ring-stone-100"
                    >
                         <img 
                           src={thought.imageUrl} 
                           alt={thought.meta.topic.replace(/\b\w/g, c => c.toUpperCase())}
                           className="w-full h-full object-contain p-5 mix-blend-multiply"
                         />
                    </motion.div>
                </div>

                {/* Reflection Text */}
                <div className="flex-1 text-center md:text-left">
                    <p className="text-xl md:text-2xl font-serif text-stone-800 italic leading-relaxed mb-4">
                       "{thought.reflection}"
                    </p>
                    {/* Category Tag */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
                        <span className="px-2 py-0.5 bg-stone-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-500">
                          {thought.meta.category}
                        </span>
                    </div>
                </div>
            </div>

            {/* Music Player */}
            <MusicPlayer song={thought.music} />

            {/* Next Step / Action */}
            {thought.meta.hasNextStep && thought.meta.nextStep && (
                <div className="w-full mb-12 relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-50 to-white border border-stone-100 p-6 shadow-sm">
                     <div className="flex items-start gap-4 relative z-10">
                        <div className="mt-1 p-2 bg-white rounded-full shadow-sm ring-1 ring-stone-100">
                            <NextStepIcon type={thought.meta.nextStep.type} />
                        </div>
                        <div>
                            <div className="text-xs font-bold tracking-widest uppercase mb-1.5 flex items-center gap-2">
                                <NextStepLabel type={thought.meta.nextStep.type} />
                            </div>
                            <p className="text-stone-700 font-medium text-lg leading-snug">
                                {thought.meta.nextStep.text}
                            </p>
                        </div>
                     </div>
                </div>
            )}

            {/* Growth Log Section (Below the fold) */}
            <div className="w-full border-t border-stone-100 pt-10">
                <div className="flex items-center gap-2 mb-8">
                  <History size={16} className="text-stone-300" />
                  <span className="text-xs font-bold tracking-[0.15em] text-stone-300 uppercase">
                    Growth Log
                  </span>
                </div>
                
                {/* Updates (newest first) */}
                <div className="space-y-8 mb-8">
                  {thought.updates?.map((update) => (
                    <div key={update.id} className="pl-6 border-l-2 border-amber-200 ml-2 relative">
                      <div className="absolute -left-[6px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-300 border-2 border-white box-content shadow-sm" />

                      <div className="mb-3">
                        <p className="text-stone-800 text-base font-medium mb-1">"{update.text}"</p>
                        <span className="text-[10px] text-stone-400 block">
                            {new Date(update.timestamp).toLocaleDateString()} {new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* AI Acknowledgment Bubble */}
                      <div className="bg-stone-50 p-4 rounded-xl text-sm text-stone-600 font-serif italic relative">
                        {/* Triangle pointer */}
                        <div className="absolute -top-1 left-4 w-2 h-2 bg-stone-50 transform rotate-45" />
                        {update.aiResponse}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Original Seed (at the bottom) */}
                <div className="pl-6 border-l-2 border-stone-100 ml-2 relative">
                   <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-stone-200 border-2 border-white box-content" />
                   <div className="flex items-baseline justify-between mb-2">
                     <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Original Seed</p>
                     <span className="text-[10px] text-stone-300 font-mono">
                        {new Date(thought.createdAt).toLocaleDateString()} {new Date(thought.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                   </div>
                   <p className="text-stone-600 italic text-base">"{thought.originalText}"</p>
                </div>

                {/* Watering Form */}
                {onWater && (
                  <form onSubmit={handleWaterSubmit} className="mt-10 relative group">
                    <input
                      type="text"
                      value={waterInput}
                      onChange={(e) => setWaterInput(e.target.value)}
                      disabled={isWatering}
                      placeholder="Add an update to water this thought..."
                      className="w-full bg-white border border-stone-200 rounded-full px-6 py-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all shadow-sm hover:shadow-md"
                    />
                    <button 
                      type="submit"
                      disabled={!waterInput.trim() || isWatering}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-stone-800 text-white rounded-full hover:bg-stone-700 disabled:bg-stone-200 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                )}
                
                {thought.growthStage === 'mature' && (
                  <div className="mt-8 text-center p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 text-amber-800/60 text-sm font-serif italic">
                    This thought has fully matured — but you can always keep watering it.
                  </div>
                )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="px-8 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
             <div className="flex items-center gap-2 text-stone-400 text-xs">
                 <Clock size={14} />
                 <span>Started {new Date(thought.createdAt).toLocaleDateString()}</span>
             </div>
             <button
                onClick={() => onDelete(thought.id)}
                className="text-stone-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};