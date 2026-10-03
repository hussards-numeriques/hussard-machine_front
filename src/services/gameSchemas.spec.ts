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
      title: null,
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
  host_player_id: null,
  max_players: 6,
  level: 'CP',
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

  it('parses a player title snapshot', () => {
    const message = serverMessageSchema.parse({
      type: 'GAME_UPDATE',
      payload: {
        ...backendGamePayload,
        players: [
          {
            ...backendGamePayload.players[0],
            title: { id: 'win-streak-bronze', rarity: 'BRONZE' },
          },
        ],
      },
    });

    if (message.type !== 'GAME_UPDATE') throw new Error('unexpected message type');
    expect(message.payload.players[0].title).toEqual({
      id: 'win-streak-bronze',
      rarity: 'BRONZE',
    });
  });

  it('parses a player with no equipped title as null', () => {
    const message = serverMessageSchema.parse({
      type: 'GAME_UPDATE',
      payload: {
        ...backendGamePayload,
        players: [{ ...backendGamePayload.players[0], title: null }],
      },
    });

    if (message.type !== 'GAME_UPDATE') throw new Error('unexpected message type');
    expect(message.payload.players[0].title).toBeNull();
  });

  it('requires host_player_id and max_players on a GAME_UPDATE payload', () => {
    const incompletePayload: Partial<typeof backendGamePayload> = { ...backendGamePayload };
    delete incompletePayload.host_player_id;
    delete incompletePayload.max_players;

    expect(() =>
      serverMessageSchema.parse({ type: 'GAME_UPDATE', payload: incompletePayload })
    ).toThrow();
  });

  it('accepts a GAME_UPDATE with the game level and keeps it', () => {
    const message = serverMessageSchema.parse({
      type: 'GAME_UPDATE',
      payload: { ...backendGamePayload, level: 'CM1' },
    });

    if (message.type !== 'GAME_UPDATE') throw new Error('unexpected message type');
    expect(message.payload.level).toBe('CM1');
  });

  it('parses a GAME_UPDATE payload missing the level with level undefined', () => {
    const incompletePayload: Partial<typeof backendGamePayload> = { ...backendGamePayload };
    delete incompletePayload.level;

    const message = serverMessageSchema.parse({ type: 'GAME_UPDATE', payload: incompletePayload });

    if (message.type !== 'GAME_UPDATE') throw new Error('unexpected message type');
    expect(message.payload.level).toBeUndefined();
  });

  it('parses a GAME_UPDATE payload with an unknown level with level undefined', () => {
    const message = serverMessageSchema.parse({
      type: 'GAME_UPDATE',
      payload: { ...backendGamePayload, level: 'LYCEE' },
    });

    if (message.type !== 'GAME_UPDATE') throw new Error('unexpected message type');
    expect(message.payload.level).toBeUndefined();
  });

  it('accepts a KICKED message', () => {
    const message = serverMessageSchema.parse({ type: 'KICKED', payload: {} });

    expect(message.type).toBe('KICKED');
  });

  it('accepts a LOBBY_CLOSED message', () => {
    const message = serverMessageSchema.parse({ type: 'LOBBY_CLOSED', payload: {} });

    expect(message.type).toBe('LOBBY_CLOSED');
  });

  it('parses typed question prompts and rejects unknown prompt types', () => {
    const question = {
      id: 'q1',
      prompt: { type: 'complement', value: 37, target: 100 },
      answer: 63,
      category: 'complement',
      time_limit_seconds: 10,
    };
    const parse = (questions: unknown[]) =>
      serverMessageSchema.safeParse({
        type: 'GAME_UPDATE',
        payload: { ...backendGamePayload, questions },
      });

    expect(parse([question]).success).toBe(true);
    expect(parse([{ ...question, prompt: { type: 'unknown', value: 1 } }]).success).toBe(false);
    expect(parse([{ ...question, statement: '37 + ? = 100', prompt: undefined }]).success).toBe(
      false
    );
  });

  it('parses WS error codes', () => {
    expect(serverMessageSchema.parse({ type: 'ERROR', payload: 'ADD_BOT_FAILED' })).toEqual({
      type: 'ERROR',
      payload: 'ADD_BOT_FAILED',
    });
    expect(serverMessageSchema.safeParse({ type: 'ERROR', payload: 'Oups' }).success).toBe(false);
  });
});
