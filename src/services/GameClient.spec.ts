import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameClient, type JoinPayload } from './GameClient';

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
            host_player_id: null,
            max_players: 6,
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

  it('type-level: JoinPayload rejects having both game_id and player_id', () => {
    // @ts-expect-error a JOIN payload must never carry both game_id and player_id
    const invalid: JoinPayload = {
      name: 'Alice',
      token: null,
      game_id: 'ABCD',
      player_id: 'guest-1',
    };
    expect(invalid).toBeDefined();
  });

  it('sends ADD_BOT with the chosen difficulty', () => {
    const client = new GameClient(vi.fn(), vi.fn());
    client.connectToLobby({ gameId: 'ABCD', playerName: 'Alice' });
    openSocket(client);
    sentMessages.length = 0;

    client.addBot('HARD');

    expect(JSON.parse(sentMessages[0])).toEqual({
      type: 'ADD_BOT',
      payload: { difficulty: 'HARD' },
    });
  });

  it('sends REMOVE_PLAYER with the target id', () => {
    const client = new GameClient(vi.fn(), vi.fn());
    client.connectToLobby({ gameId: 'ABCD', playerName: 'Alice' });
    openSocket(client);
    sentMessages.length = 0;

    client.removePlayer('player-123');

    expect(JSON.parse(sentMessages[0])).toEqual({
      type: 'REMOVE_PLAYER',
      payload: { player_id: 'player-123' },
    });
  });

  it('calls onError when a KICKED message is received', () => {
    const onError = vi.fn();
    const client = new GameClient(vi.fn(), onError);
    client.connectToLobby({ gameId: 'ABCD', playerName: 'Alice' });
    const ws = openSocket(client);

    ws.onmessage?.({
      data: JSON.stringify({ type: 'KICKED', payload: {} }),
    } as MessageEvent);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toEqual(expect.any(String));
    expect(onError.mock.calls[0][0]).not.toBe('');
  });

  it('calls onError with a distinct message when a LOBBY_CLOSED message is received', () => {
    const onError = vi.fn();
    const client = new GameClient(vi.fn(), onError);
    client.connectToLobby({ gameId: 'ABCD', playerName: 'Alice' });
    const ws = openSocket(client);

    ws.onmessage?.({
      data: JSON.stringify({ type: 'LOBBY_CLOSED', payload: {} }),
    } as MessageEvent);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toEqual(expect.any(String));
    expect(onError.mock.calls[0][0]).not.toBe('');
  });
});

describe('createLobby', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs level, max_players and the Bearer token', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ game_id: 'WXYZ' }), { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new GameClient(vi.fn(), vi.fn());
    const gameId = await client.createLobby({ level: 'CM1', maxPlayers: 8, token: 'tok' });

    expect(gameId).toBe('WXYZ');
    const [url, init] = fetchMock.mock.calls[0];
    expect((url as string).endsWith('/lobbies')).toBe(true);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer tok' });
    expect(JSON.parse(init?.body as string)).toEqual({ level: 'CM1', max_players: 8 });
  });

  it('throws when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 403 }))
    );

    const client = new GameClient(vi.fn(), vi.fn());

    await expect(
      client.createLobby({ level: 'CP', maxPlayers: 6, token: 'tok' })
    ).rejects.toThrow();
  });
});
