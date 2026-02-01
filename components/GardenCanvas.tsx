import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { ThoughtCard } from '../types';
import { PlantSprite } from './PlantSprite';

interface GardenCanvasProps {
  thoughts: ThoughtCard[];
  onPlantClick: (thought: ThoughtCard) => void;
  onNewThoughtClick: () => void;
}

// Particle effect for atmosphere (Animated)
const Particle: React.FC = () => {
  const randomX = Math.random() * 100;
  const randomY = Math.random() * 100;
  const duration = 10 + Math.random() * 20;
  
  return (
    <motion.div
      className="absolute w-1 h-1 bg-white rounded-full opacity-40 blur-[1px]"
      initial={{ x: `${randomX}%`, y: `${randomY}%`, scale: 0 }}
      animate={{ 
        y: [`${randomY}%`, `${randomY - 20}%`],
        opacity: [0, 0.6, 0],
        scale: [0, 1.5, 0]
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "linear",
        delay: Math.random() * 10
      }}
    />
  );
};

export const GardenCanvas: React.FC<GardenCanvasProps> = ({ 
  thoughts, 
  onPlantClick,
  onNewThoughtClick 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Group plants by island (assuming 12 slots per island view)
  const maxIslandIndex = thoughts.reduce((max, t) => Math.max(max, Math.floor(t.position.x / 100)), 0);
  const totalIslands = Math.max(1, maxIslandIndex + 1);

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -window.innerWidth, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: window.innerWidth, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-gradient-to-b from-[#FDFCF8] to-[#F5F5F4] overflow-hidden">
      
      {/* Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => <Particle key={i} />)}
      </div>

      {/* Navigation Controls (Desktop) */}
      {totalIslands > 1 && (
        <>
          <button 
            onClick={scrollLeft}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 text-stone-300 hover:text-stone-500 hover:bg-white/50 rounded-full transition-all"
          >
            <ChevronLeft size={32} />
          </button>
          <button 
            onClick={scrollRight}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 text-stone-300 hover:text-stone-500 hover:bg-white/50 rounded-full transition-all"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Horizontal Scroll Container (The Archipelago) */}
      <div 
        ref={containerRef}
        className="w-full h-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide items-center"
      >
        {Array.from({ length: totalIslands }).map((_, islandIndex) => (
          <div 
            key={islandIndex}
            className="relative flex-shrink-0 w-full h-full md:w-screen md:h-screen snap-center flex items-center justify-center p-4 md:p-8"
          >
            {/* Island Container - Aspect Ratio 3:2 matches the SVG's 1254x836 dimensions */}
            <div className="relative w-full max-w-[800px] aspect-[3/2]">
              
              {/* Island SVG Image */}
              <img 
                src="./island.svg" 
                alt="Floating Garden Island"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-multiply opacity-90 select-none"
              />
              
              {/* Plants for this island */}
              {thoughts
                .filter(t => Math.floor(t.position.x / 100) === islandIndex)
                .map((thought) => (
                  <PlantSprite 
                    key={thought.id} 
                    thought={thought} 
                    onClick={onPlantClick} 
                  />
                ))
              }

              {/* Empty State Prompt */}
              {islandIndex === 0 && thoughts.length === 0 && (
                 <div className="absolute top-[45%] left-[25%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      transition={{ delay: 1, duration: 2 }}
                      className="font-serif italic text-stone-500 text-base md:text-lg mix-blend-multiply"
                    >
                      The soil is listening...
                    </motion.p>
                 </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main CTA */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewThoughtClick}
          className="bg-stone-800 text-white px-8 py-4 rounded-full shadow-xl hover:shadow-2xl hover:bg-stone-700 transition-all flex items-center gap-3 group"
        >
          <Plus size={20} className="text-teal-300 group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-serif font-medium tracking-wide">Sow a New Seed</span>
        </motion.button>
      </div>

    </div>
  );
};