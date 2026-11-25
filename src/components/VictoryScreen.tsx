import { useState } from 'react';
import { motion } from 'motion/react';
import { Award, Flame, FolderOpen, RotateCcw, Target, Trophy } from 'lucide-react';
import { GameMode, GlobalScoreState } from '../types/quiz';
import { FINAL_MOTIVATIONAL_MESSAGE, ROUND_CONFIGS } from '../data/questions';
import { GoogleSignInButton } from './GoogleSignInButton';

interface VictoryScreenProps {
  scoreState: GlobalScoreState;
  mode: GameMode;
  needsAuth: boolean;
  isLoggingIn: boolean;
  onGoogleSignIn: () => void;
  onOpenDrive: () => void;
  onRestart: () => void;
}

const TROPHY_IMG_URL = '/src/assets/images/trophy_champion_1795013898960.jpg';

export function VictoryScreen({
  scoreState,
  mode,
  needsAuth,
  isLoggingIn,
  onGoogleSignIn,
  onOpenDrive,
  onRestart,
}: VictoryScreenProps) {
  const [imgError, setImgError] = useState(false);

  const accuracy =
    scoreState.totalAnswered > 0
      ? Math.round((scoreState.correctCount / scoreState.totalAnswered) * 100)
      : 0;

  const sortedTeams =
    mode === 'teams'
      ? [...scoreState.teams].sort((a, b) => b.points - a.points)
      : [];

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 bg-[#0B1426] text-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl rounded-3xl bg-[#132240]/95 border border-slate-700/90 p-6 sm:p-10 shadow-2xl flex flex-col gap-7"
      >
        {/* En-tête Podium & Score Global Final */}
        <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-700/80">
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl overflow-hidden shrink-0 bg-slate-900 ring-2 ring-amber-400 shadow-xl">
            {!imgError ? (
              <img
                src={TROPHY_IMG_URL}
                alt="Trophée du champion des mathématiques"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-amber-400 text-slate-950">
                <Trophy className="w-14 h-14" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="text-sm font-bold uppercase tracking-widest text-amber-300">
              Grande Finale Terminée
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-1">
              Résultats du Grand Quiz CM2
            </h1>

            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="px-5 py-3 rounded-2xl bg-amber-400 text-slate-950 shadow-lg">
                <div className="text-xs font-bold uppercase tracking-wide">Score Global Final</div>
                <div className="font-mono text-3xl sm:text-4xl font-extrabold tabular-nums flex items-center gap-2">
                  <Trophy className="w-7 h-7" />
                  <span>{scoreState.totalPoints.toLocaleString('fr-FR')} pts</span>
                </div>
              </div>

              <div className="px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-700">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bonnes réponses</span>
                </div>
                <div className="font-mono text-xl font-bold text-emerald-300 tabular-nums mt-0.5">
                  {scoreState.correctCount}/{scoreState.totalAnswered} ({accuracy}%)
                </div>
              </div>

              <div className="px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-700">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-sky-400" />
                  <span>Meilleure série</span>
                </div>
                <div className="font-mono text-xl font-bold text-sky-300 tabular-nums mt-0.5">
                  {scoreState.bestStreak} d’affilée
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Classement des Équipes si mode Équipes */}
        {sortedTeams.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Classement des équipes</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {sortedTeams.map((team, idx) => (
                <div
                  key={team.id}
                  className={`rounded-2xl p-4 border ${
                    idx === 0
                      ? 'bg-amber-400/15 border-amber-400 text-white'
                      : 'bg-slate-900/70 border-slate-700/80 text-slate-200'
                  }`}
                >
                  <div className="text-xs font-semibold text-amber-300">
                    {idx === 0 ? '1re place' : `${idx + 1}e place`}
                  </div>
                  <div className="font-bold text-base truncate mt-0.5">{team.name}</div>
                  <div className="font-mono text-xl font-extrabold tabular-nums text-white mt-1">
                    {team.points.toLocaleString('fr-FR')} pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Détail du Score Global par Manche */}
        <div>
          <h2 className="font-display text-lg font-bold text-white mb-3">
            Détail des points par manche
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ROUND_CONFIGS.map((round) => {
              const stat = scoreState.roundStats[round.id];
              return (
                <div
                  key={round.id}
                  className="rounded-2xl bg-slate-900/75 border border-slate-700/80 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-amber-300">
                      {round.numberLabel}
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5 leading-snug">
                      {round.title}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-baseline justify-between">
                    <span className="font-mono text-lg font-extrabold text-amber-300 tabular-nums">
                      {stat.points} pts
                    </span>
                    <span className="font-mono text-xs text-slate-400 tabular-nums">
                      {stat.correct}/{stat.total} réussies
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message final de motivation exact */}
        <div className="rounded-2xl bg-slate-900/90 border border-amber-400/40 p-5 sm:p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
            Message de l’animateur pour toute la classe
          </div>
          <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-medium">
            « {FINAL_MOTIVATIONAL_MESSAGE} »
          </p>
        </div>

        {/* Boutons Rejouer & Sauvegarde Google Drive */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={onRestart}
            className="h-14 px-8 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display text-lg font-extrabold inline-flex items-center gap-2.5 shadow-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Rejouer le Grand Quiz</span>
          </button>

          {needsAuth ? (
            <div className="flex flex-col items-center gap-1">
              <GoogleSignInButton
                onClick={onGoogleSignIn}
                disabled={isLoggingIn}
                label={
                  isLoggingIn
                    ? 'Connexion...'
                    : 'Connecter Google Drive pour sauvegarder'
                }
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenDrive}
              className="h-14 px-7 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-display text-base sm:text-lg font-extrabold inline-flex items-center gap-2.5 shadow-lg transition-colors cursor-pointer"
            >
              <FolderOpen className="w-5 h-5" />
              <span>Sauvegarder sur Google Drive</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
