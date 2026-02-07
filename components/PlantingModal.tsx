import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sprout, Loader2 } from 'lucide-react';

interface PlantingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlant: (text: string) => void;
  isLoading: boolean;
}

export const PlantingModal: React.FC<PlantingModalProps> = ({ 
  isOpen, 
  onClose, 
  onPlant, 
  isLoading 
}) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onPlant(text);
      setText(''); // clear after send, though usually we close modal
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
      />

      {/* Modal Content */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-xl bg-white rounded-3xl p-6 md:p-8 shadow-2xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-serif text-stone-800 mb-2">What's on your mind?</h2>
        <p className="text-stone-500 mb-6 text-sm">
          Plant an idea, a goal, a feeling, or a memory. Let it grow.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
            autoFocus
            className="w-full h-40 p-4 bg-stone-50 rounded-2xl border border-stone-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none resize-none text-stone-800 placeholder:text-stone-300 transition-all mb-6"
            placeholder="I'm feeling overwhelmed by..."
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 rounded-xl text-stone-500 hover:bg-stone-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim() || isLoading}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all
                ${isLoading || !text.trim() 
                  ? 'bg-stone-300 cursor-not-allowed' 
                  : 'bg-teal-700 hover:bg-teal-600 shadow-lg shadow-teal-700/20'}
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sprout size={20} />
                  <span>Plant Seed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
