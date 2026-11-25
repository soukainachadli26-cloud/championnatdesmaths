import { Home, Music, Pause, Play, Trophy, Volume2, VolumeX } from 'lucide-react';
import { GameMode, GlobalScoreState, RoundConfig } from '../types/quiz';

interface GameHudProps {
  roundConfig: RoundConfig;
  questionIndex: number;
  totalInRound: number;
  scoreState: GlobalScoreState;
  mode: GameMode;
  isPaused: boolean;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  voiceEnabled: boolean;
  scorePopKey: number;
  onTogglePause: () => void;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
  onToggleVoice: () => void;
  onExitToTitle: () => void;
}

export function GameHud({
  roundConfig,
  questionIndex,
  totalInRound,
  scoreState,
  mode,
  isPaused,
  sfxEnabled,
  musicEnabled,
  voiceEnabled,
  scorePopKey,
  onTogglePause,
  onToggleSfx,
  onToggleMusic,
  onToggleVoice,
  onExitToTitle,
}: GameHudProps) {
  const progressPct = Math.round(((questionIndex + 1) / totalInRound) * 100);

  return (
    <header className="w-full max-w-5xl mx-auto pt-3 px-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#132240]/95 border border-slate-700/80 px-4 py-2.5 shadow-lg">
        {/* Zone gauche : Retour, Pause & Progression de manche */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onExitToTitle}
            title="Retour à l'accueil"
            aria-label="Retour à l'accueil"
            className="w-10 h-10 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <Home className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onTogglePause}
            title={isPaused ? 'Reprendre' : 'Mettre en pause'}
            aria-label={isPaused ? 'Reprendre' : 'Mettre en pause'}
            className="h-10 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4 text-sky-400" />}
            <span className="hidden sm:inline">{isPaused ? 'Reprendre' : 'Pause'}</span>
          </button>

          <div className="flex flex-col min-w-0 pl-1">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-100 whitespace-nowrap">
              <span className="text-amber-300">{roundConfig.numberLabel}</span>
              <span className="text-slate-500" aria-hidden="true">
                ·
              </span>
              <span className="tabular-nums text-slate-200">
                Question {questionIndex + 1}/{totalInRound}
              </span>
            </div>
            <div className="w-28 sm:w-44 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-amber-400 transition-all duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Zone droite : Score Global & Audio */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {scoreState.currentStreak >= 2 && (
            <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-400/40 text-sky-300 text-xs font-semibold tabular-nums whitespace-nowrap">
              Série ×{scoreState.currentStreak}
            </span>
          )}

          <div
            key={scorePopKey}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold shadow-sm whitespace-nowrap ${
              scorePopKey > 0 ? 'animate-score-pop' : ''
            }`}
            aria-label={`Score global : ${scoreState.totalPoints} points`}
          >
            <Trophy className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wide hidden sm:inline">
              Score global
            </span>
            <span className="font-mono text-base sm:text-lg tabular-nums">
              {scoreState.totalPoints.toLocaleString('fr-FR')} pts
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleMusic}
              title={musicEnabled ? 'Couper la musique' : 'Activer la musique'}
              aria-label={musicEnabled ? 'Couper la musique' : 'Activer la musique'}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 ${
                musicEnabled
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'bg-slate-800/90 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onToggleSfx}
              title={sfxEnabled ? 'Couper les bruitages' : 'Activer les bruitages'}
              aria-label={sfxEnabled ? 'Couper les bruitages' : 'Activer les bruitages'}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 ${
                sfxEnabled
                  ? 'bg-sky-400/20 text-sky-300 border border-sky-400/40'
                  : 'bg-slate-800/90 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onToggleVoice}
              title={voiceEnabled ? 'Désactiver la voix de l’animateur' : 'Activer la voix de l’animateur'}
              aria-label={voiceEnabled ? 'Désactiver la voix' : 'Activer la voix'}
              className={`h-10 px-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-400 ${
                voiceEnabled
                  ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                  : 'bg-slate-800/90 text-slate-400 hover:text-slate-200'
              }`}
            >
              Voix
            </button>
          </div>
        </div>
      </div>

      {/* Barre des équipes en mode Équipes */}
      {mode === 'teams' && scoreState.teams.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {scoreState.teams.map((team, idx) => {
            const isActive = idx === scoreState.activeTeamIndex;
            return (
              <div
                key={team.id}
                className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs sm:text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-800 border-amber-400 text-white shadow-sm'
                    : 'bg-[#132240]/80 border-slate-700/70 text-slate-300'
                }`}
              >
                <span className="font-semibold truncate">
                  {isActive ? '▶ ' : ''}
                  {team.name}
                </span>
                <span className="font-mono font-bold tabular-nums text-amber-300 ml-2">
                  {team.points} pts
                </span>
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}
