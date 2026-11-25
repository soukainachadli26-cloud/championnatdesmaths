import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Trophy } from 'lucide-react';
import { GlobalScoreState, RoundConfig } from '../types/quiz';

interface RoundSummaryProps {
  completedRound: RoundConfig;
  nextRound: RoundConfig | null;
  scoreState: GlobalScoreState;
  onContinue: () => void;
}

export function RoundSummary({
  completedRound,
  nextRound,
  scoreState,
  onContinue,
}: RoundSummaryProps) {
  const stats = scoreState.roundStats[completedRound.id];
  const accuracy =
    stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="w-full max-w-2xl rounded-3xl bg-[#132240]/95 border border-slate-700/80 p-7 sm:p-10 text-center shadow-2xl"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 mb-3">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="text-sm font-bold uppercase tracking-widest text-emerald-300">
          {completedRound.numberLabel} terminée !
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-1">
          {completedRound.title}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-7">
          <div className="rounded-2xl bg-slate-900/75 border border-slate-700/80 p-4">
            <div className="text-xs text-slate-400">Points de la manche</div>
            <div className="font-mono text-2xl font-extrabold text-amber-300 tabular-nums mt-1">
              +{stats.points} pts
            </div>
          </div>
          <div className="rounded-2xl bg-slate-900/75 border border-slate-700/80 p-4">
            <div className="text-xs text-slate-400">Réussite</div>
            <div className="font-mono text-2xl font-extrabold text-emerald-300 tabular-nums mt-1">
              {stats.correct}/{stats.total} ({accuracy}%)
            </div>
          </div>
          <div className="rounded-2xl bg-amber-400 text-slate-950 p-4">
            <div className="text-xs font-bold uppercase tracking-wide">Score global</div>
            <div className="font-mono text-2xl font-extrabold tabular-nums mt-1 flex items-center justify-center gap-1.5">
              <Trophy className="w-5 h-5" />
              {scoreState.totalPoints.toLocaleString('fr-FR')}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="w-full sm:w-auto px-8 h-13 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display text-lg font-extrabold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span>
            {nextRound ? `Passer à : ${nextRound.numberLabel}` : 'Voir le Podium Final'}
          </span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
}
