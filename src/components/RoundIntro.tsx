import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Trophy } from 'lucide-react';
import { GameMode, GlobalScoreState, RoundConfig } from '../types/quiz';

interface RoundIntroProps {
  roundConfig: RoundConfig;
  questionCount: number;
  scoreState: GlobalScoreState;
  mode: GameMode;
  onStartRound: () => void;
}

export function RoundIntro({
  roundConfig,
  questionCount,
  scoreState,
  mode,
  onStartRound,
}: RoundIntroProps) {
  useEffect(() => {
    if (mode === 'auto') {
      const id = window.setTimeout(onStartRound, 3200);
      return () => window.clearTimeout(id);
    }
  }, [mode, onStartRound]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStartRound();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStartRound]);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="w-full max-w-2xl rounded-3xl bg-[#132240]/95 border border-slate-700/80 p-7 sm:p-10 text-center shadow-2xl"
      >
        <div className="text-sm font-bold uppercase tracking-widest text-amber-300">
          {roundConfig.numberLabel}
        </div>

        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-2">
          {roundConfig.title}
        </h2>

        <p className="text-base text-slate-300 mt-3 max-w-lg mx-auto leading-relaxed">
          {roundConfig.description}
        </p>

        <div className="grid grid-cols-3 gap-3 my-7">
          <div className="rounded-xl bg-slate-900/70 border border-slate-700/70 p-3">
            <div className="text-xs text-slate-400">Questions</div>
            <div className="font-mono text-xl font-bold text-white tabular-nums mt-0.5">
              {questionCount}
            </div>
          </div>
          <div className="rounded-xl bg-slate-900/70 border border-slate-700/70 p-3">
            <div className="text-xs text-slate-400">Par bonne réponse</div>
            <div className="font-mono text-xl font-bold text-amber-300 tabular-nums mt-0.5">
              +{roundConfig.basePoints} pts
            </div>
          </div>
          <div className="rounded-xl bg-slate-900/70 border border-slate-700/70 p-3">
            <div className="text-xs text-slate-400">Score global actuel</div>
            <div className="font-mono text-xl font-bold text-sky-300 tabular-nums mt-0.5 flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              {scoreState.totalPoints}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onStartRound}
          className="w-full sm:w-auto px-8 h-13 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display text-lg font-extrabold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span>Commencer la manche</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {mode === 'auto' && (
          <p className="text-xs text-sky-300 mt-3">
            Démarrage automatique dans quelques instants…
          </p>
        )}
      </motion.div>
    </div>
  );
}
