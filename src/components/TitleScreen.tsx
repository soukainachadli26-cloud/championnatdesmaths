import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User as FirebaseUser } from 'firebase/auth';
import { FolderOpen, Mic, MonitorPlay, Play, Sparkles, Timer, Users, User } from 'lucide-react';
import { GameMode } from '../types/quiz';
import { ROUND_CONFIGS } from '../data/questions';
import { GoogleSignInButton } from './GoogleSignInButton';

interface TitleScreenProps {
  mode: GameMode;
  teamCount: number;
  timerDuration: number;
  musicEnabled: boolean;
  voiceEnabled: boolean;
  driveUser: FirebaseUser | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  onChangeMode: (mode: GameMode) => void;
  onChangeTeamCount: (count: number) => void;
  onChangeTimer: (seconds: number) => void;
  onToggleMusic: () => void;
  onToggleVoice: () => void;
  onGoogleSignIn: () => void;
  onOpenDrive: () => void;
  onStartGame: () => void;
}

const STUDIO_BG_URL = '/src/assets/images/studio_backdrop_1795013900264.jpg';
const SCHOOL_EMBLEM_URL = '/src/assets/images/regenerated_image_1795015091252.png';
const HOST_IMAGE_URL = '/src/assets/images/soukaina_brown_highlights_1795035529896.jpg';

export function TitleScreen({
  mode,
  teamCount,
  timerDuration,
  musicEnabled,
  voiceEnabled,
  driveUser,
  needsAuth,
  isLoggingIn,
  onChangeMode,
  onChangeTeamCount,
  onChangeTimer,
  onToggleMusic,
  onToggleVoice,
  onGoogleSignIn,
  onOpenDrive,
  onStartGame,
}: TitleScreenProps) {
  const [bgError, setBgError] = useState(false);
  const [emblemError, setEmblemError] = useState(false);
  const [hostError, setHostError] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'BUTTON' || tag === 'INPUT') return;
        e.preventDefault();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStartGame]);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#0B1426] text-slate-100">
      {/* Studio Backdrop */}
      {!bgError && (
        <img
          src={STUDIO_BG_URL}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          onError={() => setBgError(true)}
          className="absolute inset-0 w-full h-full object-cover opacity-45"
        />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#0B1426]/75 via-[#0B1426]/65 to-[#0B1426]/95"
        aria-hidden="true"
      />

      {/* En-tête institutionnel pleine largeur en haut */}
      <header className="relative z-10 w-full px-4 pt-5 sm:pt-7">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-5xl mx-auto rounded-2xl bg-[#132240]/95 border border-slate-700/80 px-4 py-3.5 sm:px-6 sm:py-4 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6"
        >
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 bg-white p-1 ring-2 ring-amber-400 shadow-lg shadow-amber-500/15">
              {!emblemError ? (
                <img
                  src={SCHOOL_EMBLEM_URL}
                  alt="Logo École Scientifique Aboud"
                  referrerPolicy="no-referrer"
                  onError={() => setEmblemError(true)}
                  className="w-full h-full object-contain object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-display font-extrabold text-sm">
                  ESA
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="font-display text-base sm:text-xl font-extrabold tracking-tight text-amber-300 leading-tight">
                École Scientifique Aboud
              </div>
              <h1 className="font-display text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight mt-0.5">
                Grand Quiz Mathématique
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 sm:justify-end">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300">
              <span>Émission Éducative</span>
              <span aria-hidden="true" className="text-slate-500">
                ·
              </span>
              <span className="text-sky-300">Spécial CM2</span>
            </div>

            {needsAuth ? (
              <GoogleSignInButton
                onClick={onGoogleSignIn}
                disabled={isLoggingIn}
                label={isLoggingIn ? 'Connexion...' : 'Connexion Google Drive'}
              />
            ) : (
              <button
                type="button"
                onClick={onOpenDrive}
                className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-sky-400/40 text-sky-200 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <FolderOpen className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Google Drive</span>
                {driveUser?.displayName && (
                  <span className="hidden md:inline text-slate-400 font-normal">
                    · {driveUser.displayName.split(' ')[0]}
                  </span>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </header>

      {/* Contenu principal centré */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Colonne Gauche : Accroche & Programme des 4 étapes */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-7 flex flex-col justify-center gap-5"
          >
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.08]">
              Le grand défi des tables, multiples et diviseurs
            </h2>

            <p className="text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed">
              Relève les 3 grandes manches et la Grande Finale pour devenir champion des tables de
              multiplication, des multiples et des diviseurs. Ton score global grimpe à chaque
              bonne réponse !
            </p>

            {/* Aperçu des 4 étapes du tournoi (sans pilules, typographie structurée) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {ROUND_CONFIGS.map((round) => (
                <div
                  key={round.id}
                  className="rounded-xl bg-[#132240]/90 border border-slate-700/80 px-4 py-3 flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                    <span>{round.numberLabel}</span>
                    <span className="font-mono tabular-nums text-sky-300">
                      +{round.basePoints} pts
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white leading-snug">{round.title}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Colonne Droite : Panneau de Configuration & Lancement */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.06 }}
            className="lg:col-span-5 rounded-2xl bg-[#132240]/95 border border-slate-700/90 p-5 sm:p-6 shadow-2xl flex flex-col gap-5"
          >
            {/* Carte Animateur Léo */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-700/70">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-[#0B1426] ring-2 ring-amber-400 shadow-lg shadow-amber-500/15">
                {!hostError ? (
                  <img
                    src={HOST_IMAGE_URL}
                    alt="Soukaina, animatrice du Grand Quiz Mathématique"
                    referrerPolicy="no-referrer"
                    onError={() => setHostError(true)}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-amber-400 text-slate-950">
                    <Mic className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div>
                <div className="font-display text-sm font-extrabold tracking-wide text-amber-300">
                  Soukaina
                </div>
                <p className="text-sm text-slate-200 leading-snug mt-0.5">
                  « Prêts les CM2 ? Choisissez votre mode et montrez de quoi vous êtes capables ! »
                </p>
              </div>
            </div>

            {/* Sélection du Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Mode de participation
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onChangeMode('solo')}
                  className={`min-h-12 px-2.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold flex flex-col items-center justify-center gap-1 transition-colors whitespace-nowrap ${
                    mode === 'solo'
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Solo</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeMode('teams')}
                  className={`min-h-12 px-2.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold flex flex-col items-center justify-center gap-1 transition-colors whitespace-nowrap ${
                    mode === 'teams'
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Équipes</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeMode('auto')}
                  className={`min-h-12 px-2.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold flex flex-col items-center justify-center gap-1 transition-colors whitespace-nowrap ${
                    mode === 'auto'
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <MonitorPlay className="w-4 h-4" />
                  <span>Vidéo Auto</span>
                </button>
              </div>
              {mode === 'auto' && (
                <p className="text-xs text-sky-300 mt-2">
                  Idéal au tableau : le chrono défile, puis la réponse et l’explication s’affichent
                  automatiquement.
                </p>
              )}
            </div>

            {/* Nombre d'équipes si mode Équipes */}
            {mode === 'teams' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Nombre d’équipes en classe
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => onChangeTeamCount(count)}
                      className={`h-10 rounded-xl border font-mono text-sm font-bold transition-colors ${
                        teamCount === count
                          ? 'bg-sky-400 text-slate-950 border-sky-300'
                          : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {count} équipes
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Durée du Chronomètre */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                <Timer className="w-3.5 h-3.5 text-sky-400" />
                <span>Temps de réflexion par question</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 8, 10, 15].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onChangeTimer(sec)}
                    className={`h-10 rounded-xl border font-mono text-xs sm:text-sm font-bold tabular-nums whitespace-nowrap transition-colors cursor-pointer ${
                      timerDuration === sec
                        ? 'bg-sky-400 text-slate-950 border-sky-300'
                        : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {sec} sec
                  </button>
                ))}
              </div>
            </div>

            {/* Options Audio rapides */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={onToggleMusic}
                className={`flex-1 h-10 px-3 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                  musicEnabled
                    ? 'bg-amber-400/20 border-amber-400/50 text-amber-200'
                    : 'bg-slate-800/70 border-slate-700 text-slate-300'
                }`}
              >
                {musicEnabled ? 'Musique : Activée' : 'Musique : Coupée'}
              </button>
              <button
                type="button"
                onClick={onToggleVoice}
                className={`flex-1 h-10 px-3 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                  voiceEnabled
                    ? 'bg-emerald-400/20 border-emerald-400/50 text-emerald-200'
                    : 'bg-slate-800/70 border-slate-700 text-slate-300'
                }`}
              >
                {voiceEnabled ? 'Voix animateur : Oui' : 'Voix animateur : Non'}
              </button>
            </div>

            {/* CTA Principal */}
            <button
              type="button"
              onClick={onStartGame}
              className="w-full h-14 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 font-display text-lg font-extrabold flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Lancer le Grand Quiz</span>
              <Sparkles className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </main>

      {/* Ligne unique d'indication des contrôles */}
      <footer className="relative z-10 pb-4 px-4 text-center">
        <p className="text-xs text-slate-400 font-medium">
          Entrée / Espace Lancer · Clavier 1–4 Répondre · P Pause · 42 questions progressives
        </p>
      </footer>
    </div>
  );
}
