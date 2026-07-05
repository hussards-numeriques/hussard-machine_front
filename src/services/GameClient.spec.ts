import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameClient } from './GameClient';

describe('GameClient - /ws/play protocol', () => {
  let sentMessages: string[];
  let lastSocketUrl: string | null;

  class MockWebSocket {
    send = vi.fn((data: string) => sentMessages.push(data));
    close = vi.fn();
    readyState = WebSocket.OPEN;
    onopen: (() => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: (() => void) | null = null;
    onclose: (() => void) | null = null;

    constructor(url: string) {
      lastSocketUrl = url;
    }
  }

  beforeEach(() => {
    sentMessages = [];
    lastSocketUrl = null;
    localStorage.clear();
    (globalThis as typeof globalThis & { WebSocket: typeof WebSocket }).WebSocket =
      MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  const openSocket = (client: GameClient) => {
    const ws = (client as unknown as { ws: MockWebSocket }).ws;
    ws.onopen?.();
    return ws;
  };

  const emitPlayerJoined = (ws: MockWebSocket, playerId: string) => {
    ws.onmessage?.({
      data: JSON.stringify({
        type: 'PLAYER_JOINED',
        payload: {
          player_id: playerId,
          game: {
            id: 'game-1',
            state: 'WAITING',
            players: [],
            questions: [],
            current_question_index: -1,
            answers: [],
            start_time_current_question: null,
          },
        },
      }),
    } as MessageEvent);
  };

  it('connects to /ws/play for both a lobby join and a quick game join', () => {
    const client = new GameClient(vi.fn(), vi.fn());
    client.connectToQuickGame({ playerName: 'Alice' });
    expect(lastSocketUrl).toContain('/ws/play');

    client.connectToLobby({ gameId: 'ABCD', playerName: 'Alice' });
    expect(lastSocketUrl).toContain('/ws/play');
  });

  it('connectToLobby sends game_id and never a player_id, even with a stale guest id stored', () => {
    localStorage.setItem('hm_guest_player_id', 'stale-id');
    const client = new GameClient(vi.fn(), vi.fn());
    client.connectToLobby({ gameId: 'ABCD', playerName: 'Alice', token: 'jwt-token' });
    openSocket(client);

    const join = JSON.parse(sentMessages[0]);
    expect(join).toEqual({
      type: 'JOIN',
      payload: { name: 'Alice', token: 'jwt-token', game_id: 'ABCD' },
    });
  });

  it('connectToQuickGame as a guest sends the persisted player_id and stores the new one', () => {
    localStorage.setItem('hm_guest_player_id', 'previous-guest-id');
    const client = new GameClient(vi.fn(), vi.fn());
    client.connectToQuickGame({ playerName: 'Alice' });
    const ws = openSocket(client);

    const join = JSON.parse(sentMessages[0]);
    expect(join).toEqual({
      type: 'JOIN',
      payload: { name: 'Alice', token: null, player_id: 'previous-guest-id' },
    });

    emitPlayerJoined(ws, 'new-guest-id');
    expect(client.getPlayerId()).toBe('new-guest-id');
    expect(localStorage.getItem('hm_guest_player_id')).toBe('new-guest-id');
  });

  it('connectToQuickGame when authenticated never reads or writes the guest player_id', () => {
    localStorage.setItem('hm_guest_player_id', 'stale-guest-id');
    const client = new GameClient(vi.fn(), vi.fn());
    client.connectToQuickGame({ playerName: 'Alice', token: 'jwt-token' });
    const ws = openSocket(client);

    const join = JSON.parse(sentMessages[0]);
    expect(join).toEqual({
      type: 'JOIN',
      payload: { name: 'Alice', token: 'jwt-token', player_id: null },
    });

    emitPlayerJoined(ws, 'account-player-id');
    expect(client.getPlayerId()).toBe('account-player-id');
    expect(localStorage.getItem('hm_guest_player_id')).toBe('stale-guest-id');
  });
});
