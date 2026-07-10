import { describe, expect, it } from 'vitest';
import { serverMessageSchema } from './gameSchemas';

const backendGamePayload = {
  id: 'game-1',
  state: 'WAITING',
  players: [
    {
      id: 'player-1',
      name: 'Alice',
      is_ready: false,
      score: 0,
      level: 'QUATRIEME',
      grade: 'GOLD',
      daily_streak: 30,
      bot_config: null,
      player_account_id: null,
      is_bot: false,
      is_connected: true,
    },
  ],
  questions: [],
  current_question_index: -1,
  answers: [],
  start_time_current_question: null,
  is_quick_game: true,
};

describe('serverMessageSchema', () => {
  it('accepts a GAME_UPDATE with a null start_time_current_question', () => {
    const message = serverMessageSchema.parse({
      type: 'GAME_UPDATE',
      payload: backendGamePayload,
    });

    if (message.type !== 'GAME_UPDATE') throw new Error('unexpected message type');
    expect(message.payload.start_time_current_question).toBeNull();
  });

  it('accepts a GAME_UPDATE with a numeric start_time_current_question', () => {
    const message = serverMessageSchema.parse({
      type: 'GAME_UPDATE',
      payload: {
        ...backendGamePayload,
        state: 'IN_PROGRESS',
        start_time_current_question: 1751700000.5,
      },
    });

    if (message.type !== 'GAME_UPDATE') throw new Error('unexpected message type');
    expect(message.payload.start_time_current_question).toBe(1751700000.5);
  });
});
