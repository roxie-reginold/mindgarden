import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Trash2, ChevronDown } from 'lucide-react';
import { ThoughtCard, ThoughtCategory } from '../types';

interface ListViewProps {
  thoughts: ThoughtCard[];
  onThoughtClick: (thought: ThoughtCard) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES: ThoughtCategory[] = ['idea', 'todo', 'feeling', 'goal', 'memory'];
const CATEGORY_OPTIONS: { value: ThoughtCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  ...CATEGORIES.map(c => ({ value: c as ThoughtCategory, label: c.charAt(0).toUpperCase() + c.slice(1) })),
];

type DateFilter = 'all' | 'today' | 'week' | 'month';
const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const FilterDropdown: React.FC<{
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}> = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-40 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
      >
        {selected?.label}
        <ChevronDown size={12} className={`absolute right-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1.5 left-0 z-50 min-w-[140px] bg-white rounded-xl border border-stone-100 shadow-lg overflow-hidden"
          >
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  value === opt.value
                    ? 'bg-stone-800 text-white'
                    : 'text-stone-500 hover:bg-stone-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ListView: React.FC<ListViewProps> = ({ thoughts, onThoughtClick, onDelete }) => {
  const [filter, setFilter] = useState<ThoughtCategory | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filteredThoughts = thoughts.filter(t => {
    if (filter !== 'all' && t.meta.category !== filter) return false;
    if (dateFilter !== 'all') {
      const now = Date.now();
      const age = now - t.createdAt;
      if (dateFilter === 'today' && age > 24 * 60 * 60 * 1000) return false;
      if (dateFilter === 'week' && age > 7 * 24 * 60 * 60 * 1000) return false;
      if (dateFilter === 'month' && age > 30 * 24 * 60 * 60 * 1000) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-serif text-stone-800 font-medium">My Collection</h2>
        
        <div className="flex gap-2">
          <FilterDropdown
            value={filter}
            options={CATEGORY_OPTIONS}
            onChange={(v) => setFilter(v as ThoughtCategory | 'all')}
          />
          <FilterDropdown
            value={dateFilter}
            options={DATE_FILTERS}
            onChange={(v) => setDateFilter(v as DateFilter)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredThoughts.map((thought) => (
          <motion.div
            key={thought.id}
            layoutId={`list-${thought.id}`}
            onClick={() => onThoughtClick(thought)}
            whileHover={{ y: -4 }}
            className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100 cursor-pointer group flex flex-col hover:shadow-md transition-all duration-300"
          >
            {/* Minimalist Image Container */}
            <div className="aspect-square bg-white relative p-4 flex items-center justify-center border-b border-stone-50">
              <img 
                src={thought.imageUrl} 
                alt={thought.meta.topic.replace(/\b\w/g, c => c.toUpperCase())}
                loading="lazy"
                className="w-full h-full object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-110"
              />
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(thought.id); }}
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-stone-100 text-stone-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200"
              >
                <Trash2 size={12} />
              </button>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-500 border border-stone-100">
                {thought.meta.category}
              </div>
            </div>
            
            <div className="p-3">
              <h3 className="font-serif font-medium text-stone-800 text-sm mb-1 truncate leading-tight">
                {thought.meta.topic.replace(/\b\w/g, c => c.toUpperCase())}
              </h3>
              
              <div className="flex items-center justify-between mt-2">
                 <div className="flex items-center gap-1 text-[10px] text-stone-400">
                    <Calendar size={10} />
                    {new Date(thought.createdAt).toLocaleDateString()}
                 </div>
                 <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${
                    thought.growthStage === 'seed' ? 'bg-stone-100 text-stone-600' :
                    thought.growthStage === 'sprout' ? 'bg-emerald-50 text-emerald-600' :
                    thought.growthStage === 'bloom' ? 'bg-rose-50 text-rose-600' :
                    'bg-amber-50 text-amber-600'
                 }`}>
                    {thought.growthStage}
                 </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {filteredThoughts.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-block p-4 rounded-full bg-stone-50 mb-4">
             <Calendar className="text-stone-300" size={32} />
          </div>
          <p className="text-stone-400 text-sm">No plants found in this section.</p>
        </div>
      )}
    </div>
  );
};