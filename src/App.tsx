import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { Play, RotateCcw, Home } from 'lucide-react';
import {
  ENCOURAGEMENT_CORRECT,
  ENCOURAGEMENT_RETRY,
  getQuestionsForRound,
  ROUND_CONFIGS,
} from './data/questions';
import {
  GameMode,
  GamePhase,
  GlobalScoreState,
  RoundId,
  TeamScore,
} from './types/quiz';
import { audioEngine } from './utils/audio';
import { googleSignIn, initAuth, logout } from './utils/googleDrive';
import { ConfettiBurst } from './components/ConfettiBurst';
import { GameHud } from './components/GameHud';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { HostBanner } from './components/HostBanner';
import { QuestionStage } from './components/QuestionStage';
import { RoundIntro } from './components/RoundIntro';
import { RoundSummary } from './components/RoundSummary';
import { TitleScreen } from './components/TitleScreen';
import { VictoryScreen } from './components/VictoryScreen';

const TEAM_COLORS = ['bg-amber-400', 'bg-sky-400', 'bg-emerald-400', 'bg-rose-400'];

function createInitialScoreState(mode: GameMode, teamCount: number): GlobalScoreState {
  const teams: TeamScore[] =
    mode === 'teams'
      ? Array.from({ length: teamCount }, (_, idx) => ({
          id: `team-${idx + 1}`,
          name: `Équipe ${idx + 1}`,
          points: 0,
          correct: 0,
          colorClass: TEAM_COLORS[idx % TEAM_COLORS.length],
        }))
      : [];

  return {
    totalPoints: 0,
    correctCount: 0,
    totalAnswered: 0,
    currentStreak: 0,
    bestStreak: 0,
    roundStats: {
      manche1: { points: 0, correct: 0, total: getQuestionsForRound('manche1').length },
      manche2: { points: 0, correct: 0, total: getQuestionsForRound('manche2').length },
      manche3: { points: 0, correct: 0, total: getQuestionsForRound('manche3').length },
      finale: { points: 0, correct: 0, total: getQuestionsForRound('finale').length },
    },
    teams,
    activeTeamIndex: 0,
    history: [],
  };
}

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('TITLE');
  const [mode, setMode] = useState<GameMode>('solo');
  const [teamCount, setTeamCount] = useState<number>(2);
  const [timerDuration, setTimerDuration] = useState<number>(8);

  const [roundIndex, setRoundIndex] = useState<number>(0);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(8);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const [sfxEnabled, setSfxEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);

  const [scoreState, setScoreState] = useState<GlobalScoreState>(() =>
    createInitialScoreState('solo', 2)
  );
  const [scorePopKey, setScorePopKey] = useState<number>(0);
  const [confettiKey, setConfettiKey] = useState<number>(0);
  const [confettiIntensity, setConfettiIntensity] = useState<'normal' | 'victory'>('normal');

  const [hostMessage, setHostMessage] = useState<string>('');
  const [hostMood, setHostMood] = useState<'neutral' | 'excited' | 'encourage'>('neutral');
  const [lastOutcome, setLastOutcome] = useState<{
    isCorrect: boolean | null;
    pointsEarned: number;
    userAnswerDisplay: string;
  } | null>(null);

  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isDriveOpen, setIsDriveOpen] = useState<boolean>(false);

  const currentRoundConfig = ROUND_CONFIGS[roundIndex];
  const roundQuestions = useMemo(
    () => getQuestionsForRound(currentRoundConfig.id),
    [currentRoundConfig.id]
  );
  const currentQuestion = roundQuestions[questionIndex];
  const lastWholeSecondRef = useRef<number>(timerDuration);

  // Initialisation de l'écouteur Firebase Auth pour Google Drive
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setDriveUser(user);
        setNeedsAuth(false);
      },
      (user) => {
        setDriveUser(user);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setDriveUser(result.user);
        setNeedsAuth(false);
        setIsDriveOpen(true);
      }
    } catch (err) {
      console.error('Google Sign-In error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const handleGoogleLogout = useCallback(async () => {
    await logout();
    setDriveUser(null);
    setNeedsAuth(true);
  }, []);

  // Synchronisation préférences audio
  useEffect(() => {
    audioEngine.setSfxEnabled(sfxEnabled);
  }, [sfxEnabled]);

  useEffect(() => {
    audioEngine.setMusicEnabled(musicEnabled && phase !== 'TITLE' && !isPaused);
    return () => {
      if (phase === 'TITLE') {
        audioEngine.stopMusic();
      }
    };
  }, [musicEnabled, phase, isPaused]);

  useEffect(() => {
    audioEngine.setVoiceEnabled(voiceEnabled);
  }, [voiceEnabled]);

  // Raccourci clavier Pause (P ou Échap)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'QUESTION' && phase !== 'REVEAL') return;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT') return;
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase]);

  const triggerTimeUp = useCallback(() => {
    if (!currentQuestion) return;
    audioEngine.playReveal();
    const retryMsg =
      ENCOURAGEMENT_RETRY[Math.floor(Math.random() * ENCOURAGEMENT_RETRY.length)];
    setHostMessage(
      mode === 'auto'
        ? `Top chrono terminé ! Voici la bonne réponse :`
        : `Temps écoulé ! ${retryMsg}`
    );
    setHostMood('encourage');
    setLastOutcome({
      isCorrect: mode === 'auto' ? null : false,
      pointsEarned: 0,
      userAnswerDisplay: '',
    });

    if (mode !== 'auto') {
      setScoreState((prev) => ({
        ...prev,
        totalAnswered: prev.totalAnswered + 1,
        currentStreak: 0,
        history: [
          ...prev.history,
          {
            questionId: currentQuestion.id,
            roundId: currentQuestion.roundId,
            isCorrect: false,
            pointsEarned: 0,
            userSelection: '',
            correctDisplay: Array.isArray(currentQuestion.correctAnswer)
              ? currentQuestion.correctAnswer.join(', ')
              : currentQuestion.correctAnswer,
          },
        ],
      }));
    } else {
      setScoreState((prev) => ({
        ...prev,
        totalAnswered: prev.totalAnswered + 1,
      }));
    }

    audioEngine.speakHost(currentQuestion.explanation);
    setPhase('REVEAL');
  }, [currentQuestion, mode]);

  // Chronomètre de réflexion strict pendant phase === 'QUESTION'
  useEffect(() => {
    if (phase !== 'QUESTION' || isPaused) return;

    const intervalId = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, Number((prev - 0.1).toFixed(1)));
        const whole = Math.ceil(next);
        if (whole !== lastWholeSecondRef.current && whole > 0) {
          lastWholeSecondRef.current = whole;
          audioEngine.playTick(whole <= 3);
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [phase, isPaused]);

  // Déclenchement fin de chrono
  useEffect(() => {
    if (phase === 'QUESTION' && timeLeft <= 0) {
      triggerTimeUp();
    }
  }, [phase, timeLeft, triggerTimeUp]);

  const handleNextQuestion = useCallback(() => {
    audioEngine.stopSpeech();
    if (questionIndex + 1 < roundQuestions.length) {
      const nextIdx = questionIndex + 1;
      const nextQ = roundQuestions[nextIdx];
      setQuestionIndex(nextIdx);
      setTimeLeft(timerDuration);
      lastWholeSecondRef.current = timerDuration;
      setLastOutcome(null);
      setHostMessage(nextQ.hostIntro);
      setHostMood('neutral');
      setPhase('QUESTION');
      audioEngine.speakHost(nextQ.prompt);

      if (mode === 'teams') {
        setScoreState((prev) => ({
          ...prev,
          activeTeamIndex: (prev.activeTeamIndex + 1) % Math.max(1, prev.teams.length),
        }));
      }
    } else {
      // Fin de la manche courante
      if (roundIndex + 1 < ROUND_CONFIGS.length) {
        setPhase('ROUND_SUMMARY');
      } else {
        setConfettiIntensity('victory');
        setConfettiKey((k) => k + 1);
        audioEngine.playVictoryFanfare();
        setPhase('VICTORY');
      }
    }
  }, [questionIndex, roundQuestions, timerDuration, mode, roundIndex]);

  // Avance automatique en mode Vidéo Auto pendant la phase REVEAL
  useEffect(() => {
    if (mode !== 'auto' || phase !== 'REVEAL' || isPaused) return;
    const timeoutId = window.setTimeout(() => {
      handleNextQuestion();
    }, 6500);
    return () => window.clearTimeout(timeoutId);
  }, [mode, phase, isPaused, handleNextQuestion]);

  const handleStartGame = useCallback(() => {
    const freshScore = createInitialScoreState(mode, teamCount);
    setScoreState(freshScore);
    setRoundIndex(0);
    setQuestionIndex(0);
    setIsPaused(false);
    setLastOutcome(null);
    setConfettiIntensity('normal');
    audioEngine.playStartFanfare();
    setPhase('ROUND_INTRO');
    audioEngine.speakHost(
      `${ROUND_CONFIGS[0].numberLabel} : ${ROUND_CONFIGS[0].title}. ${ROUND_CONFIGS[0].description}`
    );
  }, [mode, teamCount]);

  const handleStartRound = useCallback(() => {
    const firstQ = getQuestionsForRound(ROUND_CONFIGS[roundIndex].id)[0];
    setQuestionIndex(0);
    setTimeLeft(timerDuration);
    lastWholeSecondRef.current = timerDuration;
    setLastOutcome(null);
    setHostMessage(firstQ.hostIntro);
    setHostMood('neutral');
    setPhase('QUESTION');
    audioEngine.speakHost(firstQ.prompt);
  }, [roundIndex, timerDuration]);

  const handleSubmitAnswer = useCallback(
    (selection: string | string[]) => {
      if (phase !== 'QUESTION' || !currentQuestion) return;

      let isCorrect = false;
      if (Array.isArray(currentQuestion.correctAnswer)) {
        const expected = [...currentQuestion.correctAnswer].sort();
        const chosen = Array.isArray(selection) ? [...selection].sort() : [selection];
        isCorrect =
          expected.length === chosen.length && expected.every((val, i) => val === chosen[i]);
      } else {
        const chosenStr = Array.isArray(selection) ? selection.join(', ') : selection;
        isCorrect =
          chosenStr.trim().toLowerCase() ===
          currentQuestion.correctAnswer.trim().toLowerCase();
      }

      const selectionDisplay = Array.isArray(selection) ? selection.join(', ') : selection;
      const correctDisplay = Array.isArray(currentQuestion.correctAnswer)
        ? currentQuestion.correctAnswer.join(', ')
        : currentQuestion.correctAnswer;

      let pointsEarned = 0;
      if (isCorrect) {
        const nextStreak = scoreState.currentStreak + 1;
        const streakBonus = nextStreak >= 4 ? 50 : nextStreak >= 2 ? 25 : 0;
        pointsEarned = currentRoundConfig.basePoints + streakBonus;

        audioEngine.playCorrect();
        setConfettiIntensity('normal');
        setConfettiKey((k) => k + 1);
        setScorePopKey((k) => k + 1);

        const praise =
          ENCOURAGEMENT_CORRECT[Math.floor(Math.random() * ENCOURAGEMENT_CORRECT.length)];
        setHostMessage(praise);
        setHostMood('excited');
      } else {
        audioEngine.playWrong();
        const retry =
          ENCOURAGEMENT_RETRY[Math.floor(Math.random() * ENCOURAGEMENT_RETRY.length)];
        setHostMessage(retry);
        setHostMood('encourage');
      }

      setLastOutcome({
        isCorrect,
        pointsEarned,
        userAnswerDisplay: selectionDisplay,
      });

      setScoreState((prev) => {
        const rId: RoundId = currentQuestion.roundId;
        const prevRound = prev.roundStats[rId];
        const nextStreak = isCorrect ? prev.currentStreak + 1 : 0;

        const updatedTeams =
          mode === 'teams' && prev.teams.length > 0
            ? prev.teams.map((t, idx) =>
                idx === prev.activeTeamIndex
                  ? {
                      ...t,
                      points: t.points + pointsEarned,
                      correct: t.correct + (isCorrect ? 1 : 0),
                    }
                  : t
              )
            : prev.teams;

        return {
          ...prev,
          totalPoints: prev.totalPoints + pointsEarned,
          correctCount: prev.correctCount + (isCorrect ? 1 : 0),
          totalAnswered: prev.totalAnswered + 1,
          currentStreak: nextStreak,
          bestStreak: Math.max(prev.bestStreak, nextStreak),
          roundStats: {
            ...prev.roundStats,
            [rId]: {
              ...prevRound,
              points: prevRound.points + pointsEarned,
              correct: prevRound.correct + (isCorrect ? 1 : 0),
            },
          },
          teams: updatedTeams,
          history: [
            ...prev.history,
            {
              questionId: currentQuestion.id,
              roundId: rId,
              isCorrect,
              pointsEarned,
              userSelection: selectionDisplay,
              correctDisplay,
            },
          ],
        };
      });

      audioEngine.speakHost(currentQuestion.explanation);
      setPhase('REVEAL');
    },
    [phase, currentQuestion, currentRoundConfig.basePoints, scoreState.currentStreak, mode]
  );

  const handleAwardAutoPoint = useCallback(() => {
    if (!currentQuestion) return;
    const pts = currentRoundConfig.basePoints;
    audioEngine.playCorrect();
    setConfettiIntensity('normal');
    setConfettiKey((k) => k + 1);
    setScorePopKey((k) => k + 1);
    setHostMessage('Bravo à toute la classe ! Points ajoutés au score global !');
    setHostMood('excited');

    setScoreState((prev) => {
      const rId = currentQuestion.roundId;
      const prevRound = prev.roundStats[rId];
      const nextStreak = prev.currentStreak + 1;
      return {
        ...prev,
        totalPoints: prev.totalPoints + pts,
        correctCount: prev.correctCount + 1,
        currentStreak: nextStreak,
        bestStreak: Math.max(prev.bestStreak, nextStreak),
        roundStats: {
          ...prev.roundStats,
          [rId]: {
            ...prevRound,
            points: prevRound.points + pts,
            correct: prevRound.correct + 1,
          },
        },
      };
    });
  }, [currentQuestion, currentRoundConfig.basePoints]);

  const handleContinueFromRoundSummary = useCallback(() => {
    if (roundIndex + 1 < ROUND_CONFIGS.length) {
      const nextRoundIdx = roundIndex + 1;
      setRoundIndex(nextRoundIdx);
      setQuestionIndex(0);
      setPhase('ROUND_INTRO');
      audioEngine.speakHost(
        `${ROUND_CONFIGS[nextRoundIdx].numberLabel} : ${ROUND_CONFIGS[nextRoundIdx].title}`
      );
    } else {
      setConfettiIntensity('victory');
      setConfettiKey((k) => k + 1);
      audioEngine.playVictoryFanfare();
      setPhase('VICTORY');
    }
  }, [roundIndex]);

  const handleExitToTitle = useCallback(() => {
    audioEngine.stopMusic();
    audioEngine.stopSpeech();
    setIsPaused(false);
    setPhase('TITLE');
  }, []);

  const driveModal = (
    <GoogleDriveModal
      isOpen={isDriveOpen}
      onClose={() => setIsDriveOpen(false)}
      user={driveUser}
      needsAuth={needsAuth}
      isLoggingIn={isLoggingIn}
      onSignIn={handleGoogleSignIn}
      onLogout={handleGoogleLogout}
      onAuthExpired={() => setNeedsAuth(true)}
      canSaveQuizReport={phase === 'VICTORY'}
      scoreState={scoreState}
      mode={mode}
    />
  );

  if (phase === 'TITLE') {
    return (
      <>
        <TitleScreen
          mode={mode}
          teamCount={teamCount}
          timerDuration={timerDuration}
          musicEnabled={musicEnabled}
          voiceEnabled={voiceEnabled}
          driveUser={driveUser}
          needsAuth={needsAuth}
          isLoggingIn={isLoggingIn}
          onChangeMode={setMode}
          onChangeTeamCount={setTeamCount}
          onChangeTimer={setTimerDuration}
          onToggleMusic={() => setMusicEnabled((v) => !v)}
          onToggleVoice={() => setVoiceEnabled((v) => !v)}
          onGoogleSignIn={handleGoogleSignIn}
          onOpenDrive={() => setIsDriveOpen(true)}
          onStartGame={handleStartGame}
        />
        {driveModal}
      </>
    );
  }

  if (phase === 'VICTORY') {
    return (
      <>
        <ConfettiBurst triggerKey={confettiKey} intensity="victory" />
        <VictoryScreen
          scoreState={scoreState}
          mode={mode}
          needsAuth={needsAuth}
          isLoggingIn={isLoggingIn}
          onGoogleSignIn={handleGoogleSignIn}
          onOpenDrive={() => setIsDriveOpen(true)}
          onRestart={handleStartGame}
        />
        {driveModal}
      </>
    );
  }

  const nextRoundConfig =
    roundIndex + 1 < ROUND_CONFIGS.length ? ROUND_CONFIGS[roundIndex + 1] : null;
  const activeTeam =
    mode === 'teams' && scoreState.teams.length > 0
      ? scoreState.teams[scoreState.activeTeamIndex]
      : null;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0B1426] bg-[radial-gradient(ellipse_at_top,_#172B52_0%,_#0B1426_70%)] text-slate-100">
      <ConfettiBurst triggerKey={confettiKey} intensity={confettiIntensity} />

      <GameHud
        roundConfig={currentRoundConfig}
        questionIndex={questionIndex}
        totalInRound={roundQuestions.length}
        scoreState={scoreState}
        mode={mode}
        isPaused={isPaused}
        sfxEnabled={sfxEnabled}
        musicEnabled={musicEnabled}
        voiceEnabled={voiceEnabled}
        scorePopKey={scorePopKey}
        onTogglePause={() => setIsPaused((p) => !p)}
        onToggleSfx={() => setSfxEnabled((v) => !v)}
        onToggleMusic={() => setMusicEnabled((v) => !v)}
        onToggleVoice={() => setVoiceEnabled((v) => !v)}
        onExitToTitle={handleExitToTitle}
      />

      {phase === 'ROUND_INTRO' && (
        <RoundIntro
          roundConfig={currentRoundConfig}
          questionCount={roundQuestions.length}
          scoreState={scoreState}
          mode={mode}
          onStartRound={handleStartRound}
        />
      )}

      {(phase === 'QUESTION' || phase === 'REVEAL') && currentQuestion && (
        <main className="flex-1 flex flex-col justify-center gap-4 px-4 py-5">
          <HostBanner message={hostMessage} mood={hostMood} />
          <QuestionStage
            question={currentQuestion}
            roundConfig={currentRoundConfig}
            mode={mode}
            activeTeam={activeTeam}
            phase={phase}
            timeLeft={timeLeft}
            timerDuration={timerDuration}
            isPaused={isPaused}
            lastOutcome={lastOutcome}
            onSubmitAnswer={handleSubmitAnswer}
            onRevealEarly={triggerTimeUp}
            onAwardAutoPoint={handleAwardAutoPoint}
            onNextQuestion={handleNextQuestion}
          />
        </main>
      )}

      {phase === 'ROUND_SUMMARY' && (
        <RoundSummary
          completedRound={currentRoundConfig}
          nextRound={nextRoundConfig}
          scoreState={scoreState}
          onContinue={handleContinueFromRoundSummary}
        />
      )}

      {/* Modal Pause */}
      {isPaused && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Jeu en pause"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#132240] border border-slate-700 p-6 text-center shadow-2xl">
            <h2 className="font-display text-2xl font-extrabold text-white">Jeu en pause</h2>
            <p className="text-sm text-slate-300 mt-1.5">
              Prenez le temps d’échanger avec la classe avant de reprendre le chronomètre.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Reprendre le quiz</span>
              </button>
              <button
                type="button"
                onClick={handleStartGame}
                className="h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Recommencer à zéro</span>
              </button>
              <button
                type="button"
                onClick={handleExitToTitle}
                className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Retour à l’accueil</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
