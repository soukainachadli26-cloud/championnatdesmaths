interface CircularTimerProps {
  timeLeft: number;
  timerDuration: number;
}

export function CircularTimer({ timeLeft, timerDuration }: CircularTimerProps) {
  const safeDuration = Math.max(1, timerDuration);
  const ratio = Math.max(0, Math.min(1, timeLeft / safeDuration));
  const displaySeconds = Math.max(0, Math.ceil(timeLeft));

  const isUrgent = timeLeft <= 3;
  const isWarning = !isUrgent && timeLeft <= Math.max(4, Math.floor(safeDuration / 2));

  const radius = 33;
  const circumference = 2 * Math.PI * radius;
  // Ordre décroissant : le cercle plein (offset = 0) se vide progressivement jusqu'à 0
  const strokeDashoffset = circumference * (1 - ratio);

  const strokeColor = isUrgent
    ? 'stroke-rose-500'
    : isWarning
      ? 'stroke-amber-500'
      : 'stroke-sky-500';

  const trackColor = isUrgent ? 'stroke-rose-100 fill-rose-50' : 'stroke-slate-200 fill-white';

  const textColor = isUrgent
    ? 'text-rose-600'
    : isWarning
      ? 'text-amber-700'
      : 'text-sky-700';

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`Temps restant : ${displaySeconds} secondes`}
      className={`relative w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center shrink-0 ${
        isUrgent ? 'animate-pulse' : ''
      }`}
    >
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
        <circle
          cx="40"
          cy="40"
          r={radius}
          strokeWidth="6"
          className={`${trackColor} transition-colors duration-200`}
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`${strokeColor} transition-all duration-100 ease-linear`}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className={`font-mono text-2xl sm:text-[26px] font-extrabold tabular-nums leading-none ${textColor}`}
        >
          {displaySeconds}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mt-0.5">
          sec
        </span>
      </div>
    </div>
  );
}
