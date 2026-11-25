import { motion } from 'motion/react';
import { MathVisual } from '../types/quiz';

interface MathVisualDiagramProps {
  visual: MathVisual;
}

export function MathVisualDiagram({ visual }: MathVisualDiagramProps) {
  if (visual.kind === 'grid') {
    const maxCols = Math.min(visual.cols, 12);
    const maxRows = Math.min(visual.rows, 10);
    const total = visual.rows * visual.cols;

    return (
      <div className="rounded-xl bg-slate-900/95 p-4 text-slate-100 border border-slate-700/80">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div
            className="grid gap-1 p-2 rounded-lg bg-slate-800/80 border border-slate-700"
            style={{
              gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))`,
            }}
            aria-label={visual.caption}
          >
            {Array.from({ length: maxRows * maxCols }).map((_, idx) => {
              const rowIdx = Math.floor(idx / maxCols);
              return (
                <motion.div
                  key={idx}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.16,
                    delay: Math.min(idx * 0.008, 0.32),
                  }}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm ${
                    rowIdx % 2 === 0 ? 'bg-amber-400' : 'bg-sky-400'
                  }`}
                />
              );
            })}
          </div>
          <div className="text-center sm:text-left">
            <div className="font-mono text-xl font-bold text-amber-300 tabular-nums">
              {visual.rows} × {visual.cols} = {total}
            </div>
            <p className="text-sm text-slate-300 mt-1">{visual.caption}</p>
          </div>
        </div>
      </div>
    );
  }

  if (visual.kind === 'jumps') {
    const steps = Array.from({ length: visual.count }, (_, i) => (i + 1) * visual.base);
    const secondSteps = visual.secondBase
      ? Array.from(
          { length: Math.ceil((visual.count * visual.base) / visual.secondBase) },
          (_, i) => (i + 1) * visual.secondBase!
        ).filter((n) => n <= visual.count * visual.base + visual.secondBase!)
      : [];

    return (
      <div className="rounded-xl bg-slate-900/95 p-4 text-slate-100 border border-slate-700/80">
        <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
          <span className="font-mono text-xs font-semibold text-slate-400 mr-1">0</span>
          {steps.slice(0, 8).map((val, idx) => {
            const isHighlighted = visual.highlight === val;
            return (
              <motion.div
                key={val}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.18, delay: idx * 0.05 }}
                className="flex items-center gap-1.5"
              >
                <span className="text-sky-400 text-xs font-mono">+{visual.base}→</span>
                <span
                  className={`font-mono text-sm font-bold px-2.5 py-1 rounded-md tabular-nums ${
                    isHighlighted
                      ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-200'
                      : 'bg-slate-800 text-sky-300 border border-slate-700'
                  }`}
                >
                  {val}
                </span>
              </motion.div>
            );
          })}
        </div>

        {secondSteps.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mt-2.5 pt-2.5 border-t border-slate-800">
            <span className="font-mono text-xs font-semibold text-slate-400 mr-1">0</span>
            {secondSteps.slice(0, 8).map((val, idx) => {
              const isHighlighted = visual.highlight === val;
              return (
                <motion.div
                  key={val}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.18, delay: 0.1 + idx * 0.05 }}
                  className="flex items-center gap-1.5"
                >
                  <span className="text-emerald-400 text-xs font-mono">+{visual.secondBase}→</span>
                  <span
                    className={`font-mono text-sm font-bold px-2.5 py-1 rounded-md tabular-nums ${
                      isHighlighted
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-200'
                        : 'bg-slate-800 text-emerald-300 border border-slate-700'
                    }`}
                  >
                    {val}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}

        <p className="text-sm text-slate-300 mt-3 text-center sm:text-left">{visual.caption}</p>
      </div>
    );
  }

  if (visual.kind === 'groups') {
    const groupCount = visual.divisor;
    const perGroup = Math.floor(visual.total / groupCount);
    const remainder = visual.remainder ?? 0;

    return (
      <div className="rounded-xl bg-slate-900/95 p-4 text-slate-100 border border-slate-700/80">
        {visual.divisorsList ? (
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            {visual.divisorsList.map((d, idx) => (
              <motion.span
                key={d}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.16, delay: idx * 0.05 }}
                className="font-mono text-base font-bold px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 tabular-nums"
              >
                {d}
              </motion.span>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            {Array.from({ length: Math.min(groupCount, 9) }).map((_, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.16, delay: idx * 0.05 }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 font-mono text-sm font-bold text-emerald-300 tabular-nums"
              >
                {perGroup}
              </motion.div>
            ))}
            {remainder > 0 && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.35 }}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/50 font-mono text-sm font-bold text-rose-300 tabular-nums"
              >
                Reste : {remainder}
              </motion.div>
            )}
          </div>
        )}
        <p className="text-sm text-slate-300 mt-3 text-center sm:text-left">{visual.caption}</p>
      </div>
    );
  }

  if (visual.kind === 'sequence') {
    return (
      <div className="rounded-xl bg-slate-900/95 p-4 text-slate-100 border border-slate-700/80">
        <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
          {visual.items.map((num, idx) => (
            <motion.div
              key={`${num}-${idx}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.16, delay: idx * 0.04 }}
              className="flex items-center gap-1.5"
            >
              {idx > 0 && (
                <span className="font-mono text-xs text-amber-400 font-semibold">
                  +{visual.step}→
                </span>
              )}
              <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-sky-300 tabular-nums">
                {num}
              </span>
            </motion.div>
          ))}
        </div>
        <p className="text-sm text-slate-300 mt-3 text-center sm:text-left">{visual.caption}</p>
      </div>
    );
  }

  // visual.kind === 'rule'
  return (
    <div className="rounded-xl bg-slate-900/95 p-4 text-slate-100 border border-slate-700/80">
      <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
        {visual.examples.map((num, idx) => {
          const str = String(num);
          const prefix = str.slice(0, -1);
          const last = str.slice(-1);
          return (
            <motion.span
              key={num}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.16, delay: idx * 0.06 }}
              className="font-mono text-base font-bold px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 tabular-nums"
            >
              <span className="text-slate-200">{prefix}</span>
              <span className={visual.highlightLastDigit ? 'text-amber-400 underline' : 'text-slate-200'}>
                {last}
              </span>
            </motion.span>
          );
        })}
      </div>
      <p className="text-sm text-slate-300 mt-3 text-center sm:text-left">{visual.caption}</p>
    </div>
  );
}
