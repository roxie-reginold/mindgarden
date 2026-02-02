import React from 'react';
import { motion } from 'framer-motion';
import { Music, ExternalLink } from 'lucide-react';
import { SongRecommendation } from '../types';

interface MusicPlayerProps {
  song: SongRecommendation | undefined;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ song }) => {
  if (!song) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mb-8 relative overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-teal-50 via-purple-50 to-pink-50 shadow-sm"
    >
      {/* Header with Icon */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-2">
        <Music size={18} className="text-purple-600" />
        <span className="text-xs font-bold tracking-widest text-purple-700 uppercase">
          Your Song
        </span>
      </div>

      {/* Song Info */}
      <div className="px-5 pb-4">
        <div className="min-w-0">
          <h3 className="font-serif text-lg text-stone-800 font-semibold truncate">
            {song.name}
          </h3>
          <p className="text-sm text-stone-600 truncate mb-2">
            {song.artist}
          </p>
          
          {song.reasoning && (
            <p className="text-xs text-stone-500 italic leading-relaxed font-serif">
              "{song.reasoning}"
            </p>
          )}
        </div>
      </div>

      {/* Spotify Embed Player */}
      <div className="px-5 pb-4">
        <div className="rounded-xl overflow-hidden shadow-sm">
          <iframe
            src={`https://open.spotify.com/embed/track/${song.trackId}?utm_source=generator&theme=0&autoplay=1`}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={`Spotify player for ${song.name}`}
          />
        </div>
      </div>

      {/* External Link Button */}
      <div className="px-5 pb-5">
        <a
          href={song.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-full transition-colors shadow-sm hover:shadow-md"
        >
          <span>Open in Spotify</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-transparent rounded-full blur-2xl pointer-events-none" />
    </motion.div>
  );
};
