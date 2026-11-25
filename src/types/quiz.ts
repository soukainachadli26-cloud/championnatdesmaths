export type GameMode = 'solo' | 'teams' | 'auto';

export type GamePhase =
  | 'TITLE'
  | 'ROUND_INTRO'
  | 'QUESTION'
  | 'REVEAL'
  | 'ROUND_SUMMARY'
  | 'VICTORY';

export type RoundId = 'manche1' | 'manche2' | 'manche3' | 'finale';

export type QuestionType = 'single' | 'multi' | 'boolean' | 'input';

export type MathVisual =
  | {
      kind: 'grid';
      rows: number;
      cols: number;
      caption: string;
    }
  | {
      kind: 'jumps';
      base: number;
      count: number;
      highlight?: number;
      secondBase?: number;
      caption: string;
    }
  | {
      kind: 'groups';
      total: number;
      divisor: number;
      remainder?: number;
      divisorsList?: number[];
      caption: string;
    }
  | {
      kind: 'sequence';
      items: number[];
      step: number;
      caption: string;
    }
  | {
      kind: 'rule';
      examples: number[];
      highlightLastDigit?: boolean;
      caption: string;
    };

export interface QuizQuestion {
  id: string;
  roundId: RoundId;
  type: QuestionType;
  categoryLabel: string;
  prompt: string;
  hostIntro: string;
  options?: string[];
  correctAnswer: string | string[];
  booleanLabels?: [string, string];
  inputSuffix?: string;
  explanation: string;
  visual: MathVisual;
}

export interface RoundConfig {
  id: RoundId;
  numberLabel: string;
  title: string;
  subtitle: string;
  description: string;
  basePoints: number;
  accentColor: string;
}

export interface TeamScore {
  id: string;
  name: string;
  points: number;
  correct: number;
  colorClass: string;
}

export interface RoundStat {
  points: number;
  correct: number;
  total: number;
}

export interface AnswerRecord {
  questionId: string;
  roundId: RoundId;
  isCorrect: boolean;
  pointsEarned: number;
  userSelection: string;
  correctDisplay: string;
}

export interface GlobalScoreState {
  totalPoints: number;
  correctCount: number;
  totalAnswered: number;
  currentStreak: number;
  bestStreak: number;
  roundStats: Record<RoundId, RoundStat>;
  teams: TeamScore[];
  activeTeamIndex: number;
  history: AnswerRecord[];
}
