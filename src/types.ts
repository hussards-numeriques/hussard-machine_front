export interface BotConfig {
  correctness_probability: number;
  average_response_time: number;
}

export interface Player {
  id: string;
  name: string;
  is_bot: boolean;
  is_ready: boolean;
  score: number;
  bot_config: BotConfig | null;
}

export interface Question {
  id: string;
  statement: string;
  answer: number;
  time_limit_seconds: number;
}

export interface Answer {
  player_id: string;
  question_id: string;
  value: number;
  timestamp: number;
  is_correct: boolean;
  points_earned: number;
}

export const GameState = {
  WAITING: 'WAITING',
  COUNTDOWN: 'COUNTDOWN',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];

export interface GameHistoryParticipant {
  display_name: string;
  is_bot: boolean;
  final_rank: number;
  score: number;
  correct_answers: number;
  total_answers: number;
  experience_gained: number;
}

export interface GameHistoryEntry {
  id: string;
  played_at: string;
  duration_seconds: number;
  is_quick_game: boolean;
  questions_count: number;
  winner_display_name: string | null;
  my_rank: number;
  my_score: number;
  my_correct_answers: number;
  my_total_answers: number;
  experience_gained: number;
  participants: GameHistoryParticipant[];
}

export interface PlayerProfile {
  username: string;
  level: string;
  experience: number;
  grade: string;
  can_promote: boolean;
  history: GameHistoryEntry[];
}

export interface GameConfig {
  experience_per_grade: number;
  promotion_threshold: number;
  grades: string[];
  levels: string[];
}

export interface Game {
  id: string;
  state: GameState;
  players: Player[];
  questions: Question[];
  current_question_index: number;
  answers: Answer[];
  start_time_current_question?: number;
  is_quick_game?: boolean;
}
