import React from 'react';
import { motion } from 'framer-motion';
import { ThoughtCard } from '../types';

interface PlantSpriteProps {
  thought: ThoughtCard;
  onClick: (thought: ThoughtCard) => void;
}

export const PlantSprite: React.FC<PlantSpriteProps> = ({ thought, onClick }) => {

  // Calculate size based on growth stage
  const getSize = () => {
    switch(thought.growthStage) {
      case 'seed': return 'w-16 h-16 md:w-20 md:h-20';
      case 'sprout': return 'w-24 h-24 md:w-28 md:h-28';
      case 'bloom': return 'w-32 h-32 md:w-36 md:h-36';
      case 'fruit': return 'w-40 h-40 md:w-44 md:h-44';
      default: return 'w-24 h-24 md:w-28 md:h-28';
    }
  };

  // Normalize X for the specific island context.
  const localX = thought.position.x % 100;
  const localY = thought.position.y;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${localX}%`,
        top: `${localY}%`,
        zIndex: Math.floor(localY),
        mixBlendMode: 'multiply',
      }}
      className="cursor-pointer group flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-[85%]"
      onClick={() => onClick(thought)}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          y: [0, -4, 0],
        }}
        transition={{
          scale: { type: "spring", stiffness: 260, damping: 20 },
          y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }
        }}
      >
        <div className={`
          relative ${getSize()} flex items-center justify-center
          transition-transform duration-300 group-hover:scale-110
        `}>
          <img
            src={thought.imageUrl}
            alt={thought.meta.topic}
            className="w-full h-full object-contain"
          />

          {/* Grounding shadow */}
          <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-1/2 h-1.5 bg-stone-900/10 blur-[2px] rounded-[100%] -z-10 pointer-events-none" />
        </div>
      </motion.div>

      {/* Hover Label - Topic Only */}
      <div className="absolute -top-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1 pointer-events-none z-50">
        <div className="bg-white backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
          <span className="font-serif text-stone-700 text-xs md:text-sm whitespace-nowrap">
            {thought.meta.topic}
          </span>
        </div>
      </div>
    </div>
  );
};
