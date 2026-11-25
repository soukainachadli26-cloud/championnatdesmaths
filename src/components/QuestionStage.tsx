import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Delete,
  Eye,
  HelpCircle,
  Lightbulb,
  XCircle,
} from 'lucide-react';
import { GameMode, QuizQuestion, RoundConfig, TeamScore } from '../types/quiz';
import { CircularTimer } from './CircularTimer';
import { MathVisualDiagram } from './MathVisualDiagram';

interface QuestionStageProps {
  question: QuizQuestion;
  roundConfig: RoundConfig;
  mode: GameMode;
  activeTeam: TeamScore | null;
  phase: 'QUESTION' | 'REVEAL';
  timeLeft: number;
  timerDuration: number;
  isPaused: boolean;
  lastOutcome: {
    isCorrect: boolean | null;
    pointsEarned: number;
    userAnswerDisplay: string;
  } | null;
  onSubmitAnswer: (selection: string | string[]) => void;
  onRevealEarly: () => void;
  onAwardAutoPoint: () => void;
  onNextQuestion: () => void;
}

export function QuestionStage({
  question,
  roundConfig,
  mode,
  activeTeam,
  phase,
  timeLeft,
  timerDuration,
  isPaused,
  lastOutcome,
  onSubmitAnswer,
  onRevealEarly,
  onAwardAutoPoint,
  onNextQuestion,
}: QuestionStageProps) {
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [autoCredited, setAutoCredited] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Réinitialiser les champs à chaque nouvelle question
  useEffect(() => {
    setMultiSelected([]);
    setInputValue('');
    setAutoCredited(false);
    if (question.type === 'input' && mode !== 'auto') {
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [question.id, question.type, mode]);

  // Raccourcis clavier 1-4 et Entrée
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isPaused) return;
      if (phase === 'REVEAL') {
        if (e.key === 'Enter') {
          e.preventDefault();
          onNextQuestion();
        }
        return;
      }

      if (mode === 'auto') return;

      if (question.type === 'single' && question.options) {
        const idx = ['1', '2', '3', '4'].indexOf(e.key);
        if (idx !== -1 && question.options[idx]) {
          e.preventDefault();
          onSubmitAnswer(question.options[idx]);
        }
      } else if (question.type === 'boolean') {
        const labels = question.booleanLabels ?? ['Vrai', 'Faux'];
        if (e.key === '1') {
          e.preventDefault();
          onSubmitAnswer(labels[0]);
        } else if (e.key === '2') {
          e.preventDefault();
          onSubmitAnswer(labels[1]);
        }
      } else if (question.type === 'multi' && e.key === 'Enter' && multiSelected.length > 0) {
        e.preventDefault();
        onSubmitAnswer(multiSelected);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, isPaused, mode, question, multiSelected, onSubmitAnswer, onNextQuestion]);

  const toggleMultiOption = (opt: string) => {
    if (phase !== 'QUESTION' || mode === 'auto') return;
    setMultiSelected((prev) =>
      prev.includes(opt) ? prev.filter((item) => item !== opt) : [...prev, opt]
    );
  };

  const handleDigitClick = (digit: string) => {
    if (phase !== 'QUESTION' || mode === 'auto') return;
    setInputValue((prev) => (prev.length < 4 ? prev + digit : prev));
  };

  const correctDisplay = Array.isArray(question.correctAnswer)
    ? question.correctAnswer.join(', ')
    : question.correctAnswer;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* En-tête de la carte Question : Catégorie + Chronomètre circulaire décroissant */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-8 py-3 bg-slate-50 border-b border-slate-200 min-h-22 sm:min-h-24">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
            <span className="text-sky-700 font-bold">{roundConfig.numberLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{question.categoryLabel}</span>
            {mode === 'teams' && activeTeam && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 font-bold">Tour : {activeTeam.name}</span>
              </>
            )}
          </div>

          {phase === 'QUESTION' ? (
            <CircularTimer timeLeft={timeLeft} timerDuration={timerDuration} />
          ) : (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Réponse révélée</span>
            </div>
          )}
        </div>

        {/* Corps de la Question */}
        <div className="p-5 sm:p-8">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug text-center mb-6">
            {question.prompt}
          </h2>

          {/* PHASE QUESTION : Jamais de réponse révélée avant la fin du chrono ou validation */}
          {phase === 'QUESTION' && (
            <div>
              {mode === 'auto' ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-700 mb-3">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    Temps de réflexion pour toute la classe !
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Écrivez votre réponse sur votre ardoise ou préparez-vous à répondre à l’oral…
                  </p>

                  {question.options && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
                      {question.options.map((opt) => (
                        <div
                          key={opt}
                          className="rounded-xl bg-white border border-slate-200 px-3 py-2.5 font-mono text-base font-bold text-slate-800 shadow-xs"
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 flex justify-center">
                    <button
                      type="button"
                      onClick={onRevealEarly}
                      className="h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Révéler la réponse maintenant</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* QCM Choix unique */}
                  {question.type === 'single' && question.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {question.options.map((opt, idx) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => onSubmitAnswer(opt)}
                          className="min-h-15 px-5 py-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50 border-2 border-slate-200 hover:border-amber-400 text-left flex items-center gap-3.5 transition-all cursor-pointer active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-amber-500"
                        >
                          <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-mono text-sm font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-lg sm:text-xl font-bold text-slate-900">
                            {opt}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Vrai / Faux ou Oui / Non */}
                  {question.type === 'boolean' && (
                    <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                      {(question.booleanLabels ?? ['Vrai', 'Faux']).map((label, idx) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => onSubmitAnswer(label)}
                          className="min-h-16 px-6 py-4 rounded-2xl bg-slate-50 hover:bg-amber-50 border-2 border-slate-200 hover:border-amber-400 font-display text-xl font-extrabold text-slate-900 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.99]"
                        >
                          <span className="w-7 h-7 rounded-md bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Sélection Multiple */}
                  {question.type === 'multi' && question.options && (
                    <div className="flex flex-col items-center gap-5">
                      <p className="text-sm text-slate-600 font-medium">
                        Sélectionne toutes les bonnes réponses puis clique sur Valider :
                      </p>
                      <div className="flex flex-wrap justify-center gap-3">
                        {question.options.map((opt) => {
                          const selected = multiSelected.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => toggleMultiOption(opt)}
                              className={`min-w-18 h-14 px-5 rounded-2xl border-2 font-mono text-xl font-bold transition-all cursor-pointer ${
                                selected
                                  ? 'bg-sky-600 border-sky-700 text-white shadow-md scale-[1.03]'
                                  : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-sky-400'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        disabled={multiSelected.length === 0}
                        onClick={() => onSubmitAnswer(multiSelected)}
                        className="h-12 px-8 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-45 disabled:cursor-not-allowed text-slate-950 font-display text-base font-extrabold transition-colors cursor-pointer"
                      >
                        Valider ma sélection ({multiSelected.length})
                      </button>
                    </div>
                  )}

                  {/* Saisie Numérique / Pavé tactile */}
                  {question.type === 'input' && (
                    <div className="max-w-sm mx-auto flex flex-col items-center gap-4">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (inputValue.trim()) {
                            onSubmitAnswer(inputValue.trim());
                          }
                        }}
                        className="w-full flex gap-2"
                      >
                        <input
                          ref={inputRef}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={inputValue}
                          onChange={(e) =>
                            setInputValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))
                          }
                          placeholder="?"
                          aria-label="Ta réponse numérique"
                          className="flex-1 h-14 px-4 rounded-xl border-2 border-slate-300 focus:border-sky-500 focus:outline-none text-center font-mono text-2xl font-bold text-slate-900 tabular-nums"
                        />
                        <button
                          type="submit"
                          disabled={!inputValue.trim()}
                          className="h-14 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-45 text-slate-950 font-display text-base font-extrabold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Valider
                        </button>
                      </form>

                      {/* Pavé numérique pratique pour tableau interactif ou tablette */}
                      <div className="grid grid-cols-5 gap-2 w-full">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => handleDigitClick(d)}
                            className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 font-mono text-lg font-bold text-slate-900 transition-colors cursor-pointer"
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                      {inputValue.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setInputValue((prev) => prev.slice(0, -1))}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Delete className="w-3.5 h-3.5" />
                          <span>Effacer un chiffre</span>
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* PHASE REVEAL : Bonne réponse animée + Explication + Schéma Mathématique */}
          {phase === 'REVEAL' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-5"
            >
              {/* Bannière résultat */}
              <div
                className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  lastOutcome?.isCorrect === true
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : lastOutcome?.isCorrect === false
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : 'bg-sky-50 border-sky-300 text-sky-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  {lastOutcome?.isCorrect === true ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
                  ) : lastOutcome?.isCorrect === false ? (
                    <XCircle className="w-7 h-7 text-rose-600 shrink-0" />
                  ) : (
                    <Lightbulb className="w-7 h-7 text-sky-600 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
                      Bonne réponse
                    </div>
                    <div className="font-mono text-2xl sm:text-3xl font-extrabold tabular-nums">
                      {correctDisplay}
                    </div>
                  </div>
                </div>

                {lastOutcome && lastOutcome.pointsEarned > 0 ? (
                  <div className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-mono text-base font-extrabold tabular-nums">
                    +{lastOutcome.pointsEarned} pts ajoutés au score global
                  </div>
                ) : mode === 'auto' ? (
                  <button
                    type="button"
                    disabled={autoCredited}
                    onClick={() => {
                      setAutoCredited(true);
                      onAwardAutoPoint();
                    }}
                    className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap ${
                      autoCredited
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                    }`}
                  >
                    {autoCredited
                      ? `Classe récompensée (+${roundConfig.basePoints} pts)`
                      : `La classe a trouvé (+${roundConfig.basePoints} pts)`}
                  </button>
                ) : lastOutcome?.userAnswerDisplay ? (
                  <div className="text-sm font-medium text-rose-800">
                    Ta réponse : <span className="font-mono font-bold">{lastOutcome.userAnswerDisplay}</span>
                  </div>
                ) : (
                  <div className="text-sm font-medium text-rose-800">Temps écoulé</div>
                )}
              </div>

              {/* Explication courte CM2 */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sky-700 mb-1">
                  <Lightbulb className="w-4 h-4" />
                  <span>Explication</span>
                </div>
                <p className="text-base font-medium text-slate-800 leading-relaxed">
                  {question.explanation}
                </p>
              </div>

              {/* Schéma mathématique animé */}
              <MathVisualDiagram visual={question.visual} />

              {/* Bouton Question suivante */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={onNextQuestion}
                  className="h-12 px-7 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-display text-base font-bold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
