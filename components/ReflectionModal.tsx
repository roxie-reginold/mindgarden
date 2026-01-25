import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Calendar, Sprout, Footprints, Lightbulb, Heart, Send, History } from 'lucide-react';
import { ThoughtCard, NextStepType, GrowthStage } from '../types';

interface ReflectionModalProps {
  thought: ThoughtCard | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onWater?: (thought: ThoughtCard, update: string) => void;
}

const NextStepIcon = ({ type }: { type: NextStepType }) => {
  switch (type) {
    case 'do': return <Footprints size={16} className="text-teal-600" />;
    case 'clarify': return <Lightbulb size={16} className="text-amber-600" />;
    case 'reflect': return <Heart size={16} className="text-rose-600" />;
    default: return <Sprout size={16} className="text-stone-600" />;
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

const GrowthStageBadge = ({ stage }: { stage: GrowthStage }) => {
  const colors = {
    seed: 'bg-stone-100 text-stone-600',
    sprout: 'bg-emerald-100 text-emerald-700',
    bloom: 'bg-rose-100 text-rose-700',
    fruit: 'bg-amber-100 text-amber-700'
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[stage]}`}>
      {stage} Phase
    </span>
  );
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
          className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
        />
        
        {/* Modal Card */}
        <motion.div 
          layoutId={thought.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col md:flex-row"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          {/* Image Side - Fixed */}
          <div className="md:w-5/12 aspect-square md:aspect-auto bg-stone-100 relative group">
            <img 
              src={thought.imageUrl} 
              alt={thought.meta.topic} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100 flex flex-col justify-end p-6">
               <h2 className="text-white font-serif text-2xl leading-tight mb-1">{thought.meta.topic}</h2>
               <div className="flex gap-2">
                 <span className="text-white/80 text-xs font-medium uppercase tracking-wider">{thought.meta.category}</span>
                 <span className="text-white/60 text-xs">•</span>
                 <span className="text-white/80 text-xs font-medium uppercase tracking-wider">{thought.meta.emotion}</span>
               </div>
            </div>
          </div>

          {/* Content Side - Scrollable */}
          <div className="md:w-7/12 flex flex-col bg-white overflow-hidden">
            <div className="overflow-y-auto p-6 md:p-8 flex-1">
              
              {/* Main Reflection */}
              <div className="mb-8 text-center">
                <GrowthStageBadge stage={thought.growthStage} />
                <p className="mt-4 text-xl md:text-2xl font-serif text-stone-800 italic leading-relaxed">
                  "{thought.reflection}"
                </p>
              </div>

              {/* Next Step - Conditional */}
              {thought.meta.hasNextStep && thought.meta.nextStep && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    mb-8 p-5 rounded-xl border flex flex-col gap-2 relative overflow-hidden
                    ${thought.meta.nextStep.type === 'do' ? 'bg-teal-50 border-teal-100' : ''}
                    ${thought.meta.nextStep.type === 'clarify' ? 'bg-amber-50 border-amber-100' : ''}
                    ${thought.meta.nextStep.type === 'reflect' ? 'bg-rose-50 border-rose-100' : ''}
                  `}
                >
                  <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
                    <NextStepIcon type={thought.meta.nextStep.type} />
                    <NextStepLabel type={thought.meta.nextStep.type} />
                  </div>
                  <p className="text-stone-700 font-medium text-base">
                    {thought.meta.nextStep.text}
                  </p>
                </motion.div>
              )}

              {/* Journal / Growth Section */}
              <div className="border-t border-stone-100 pt-8">
                <div className="flex items-center gap-2 mb-4">
                  <History size={16} className="text-stone-400" />
                  <span className="text-xs font-bold tracking-widest text-stone-400 uppercase">
                    Growth Log
                  </span>
                </div>

                {/* Original Input */}
                <div className="pl-4 border-l-2 border-stone-200 ml-2 mb-6">
                   <p className="text-stone-500 text-sm mb-1">Original Seed</p>
                   <p className="text-stone-700 italic">"{thought.originalText}"</p>
                </div>

                {/* Updates History */}
                <div className="space-y-6">
                  {thought.updates?.map((update) => (
                    <div key={update.id} className="pl-4 border-l-2 border-amber-200 ml-2 relative">
                      <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-amber-300" />
                      <p className="text-stone-800 text-sm mb-2">"{update.text}"</p>
                      
                      {/* AI Acknowledgment */}
                      <div className="bg-stone-50 p-3 rounded-lg text-sm text-stone-600 font-serif italic mb-2">
                        {update.aiResponse}
                      </div>

                      {/* Historical Next Step */}
                      {update.nextStep && (
                        <div className={`
                          flex items-start gap-2 p-2 rounded-lg border mb-1
                          ${update.nextStep.type === 'do' ? 'bg-teal-50/50 border-teal-100' : ''}
                          ${update.nextStep.type === 'clarify' ? 'bg-amber-50/50 border-amber-100' : ''}
                          ${update.nextStep.type === 'reflect' ? 'bg-rose-50/50 border-rose-100' : ''}
                        `}>
                          <div className="mt-0.5"><NextStepIcon type={update.nextStep.type} /></div>
                          <p className="text-xs text-stone-600">
                            <span className="font-semibold text-stone-500 uppercase tracking-wider text-[10px] mr-1 opacity-70">
                              Suggestion:
                            </span>
                            {update.nextStep.text}
                          </p>
                        </div>
                      )}

                      <span className="text-[10px] text-stone-400 block">
                        {new Date(update.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Water Input */}
                {onWater && thought.growthStage !== 'fruit' && (
                  <form onSubmit={handleWaterSubmit} className="mt-8 relative">
                    <input
                      type="text"
                      value={waterInput}
                      onChange={(e) => setWaterInput(e.target.value)}
                      disabled={isWatering}
                      placeholder="Add an update to water this thought..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-full px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!waterInput.trim() || isWatering}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:bg-stone-300 transition-colors"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                )}
                
                {thought.growthStage === 'fruit' && (
                  <div className="mt-8 text-center p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm font-serif italic">
                    This thought has borne fruit. It is safe to rest now.
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-stone-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2 text-stone-400 text-xs">
                <Calendar size={14} />
                {new Date(thought.createdAt).toLocaleDateString()}
              </div>
              
              <button
                onClick={() => onDelete(thought.id)}
                className="text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
              >
                <Trash2 size={16} />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};