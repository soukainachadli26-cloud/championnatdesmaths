import { useState } from 'react';
import { motion } from 'motion/react';
import { Mic } from 'lucide-react';

interface HostBannerProps {
  message: string;
  mood?: 'neutral' | 'excited' | 'encourage';
}

const HOST_IMAGE_URL = '/src/assets/images/soukaina_brown_highlights_1795035529896.jpg';

export function HostBanner({ message, mood = 'neutral' }: HostBannerProps) {
  const [imgError, setImgError] = useState(false);

  const ringClass =
    mood === 'excited'
      ? 'ring-emerald-400'
      : mood === 'encourage'
        ? 'ring-sky-400'
        : 'ring-amber-400';

  return (
    <div className="flex items-center gap-3 sm:gap-4 max-w-4xl mx-auto w-full">
      <motion.div
        key={mood}
        initial={{ scale: 0.94 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 bg-[#132240] ring-2 ${ringClass} shadow-lg`}
      >
        {!imgError ? (
          <img
            src={HOST_IMAGE_URL}
            alt="Soukaina, animatrice du Grand Quiz Mathématique"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950">
            <Mic className="w-7 h-7" />
          </div>
        )}
      </motion.div>

      <motion.div
        key={message}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="flex-1 rounded-2xl bg-[#132240]/95 border border-slate-700/80 px-4 py-2.5 sm:px-5 sm:py-3 shadow-md"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 mb-0.5">
          <span>Soukaina</span>
        </div>
        <p className="text-sm sm:text-base font-medium text-slate-100 leading-snug">{message}</p>
      </motion.div>
    </div>
  );
}
