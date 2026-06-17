import type { Game } from '../types';

type GameUpdateCallback = (game: Game) => void;
type ErrorCallback = (error: string) => void;
type QuestionCountdownCallback = (seconds: number) => void;

const getApiUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  }

  return '';
};

const getWsUrl = (path: string) => {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (apiUrl) {
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = apiUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    return `${wsProtocol}://${wsHost}${path}`;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  return `${protocol}//${host}${path}`;
};

export class GameClient {
  private ws: WebSocket | null = null;
  private playerId: string | null = null;
  private onGameUpdate: GameUpdateCallback;
  private onError: ErrorCallback;
  private onQuestionCountdown: QuestionCountdownCallback | null = null;
  private apiUrl: string;

  constructor(onGameUpdate: GameUpdateCallback, onError: ErrorCallback) {
    this.onGameUpdate = onGameUpdate;
    this.onError = onError;
    this.apiUrl = getApiUrl();
  }

  public setQuestionCountdownCallback(callback: QuestionCountdownCallback | null) {
    this.onQuestionCountdown = callback;
  }

  public async createLobby(): Promise<string> {
    const url = this.apiUrl ? `${this.apiUrl}/lobbies` : '/api/lobbies';
    const response = await fetch(url, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to create lobby');
    }
    const data = await response.json();
    return data.game_id;
  }

  public async createQuickGame(): Promise<string> {
    const url = this.apiUrl ? `${this.apiUrl}/quick-games` : '/api/quick-games';
    const response = await fetch(url, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to create quick game');
    }
    const data = await response.json();
    return data.game_id;
  }

  public connect(gameId: string, playerName: string, token: string | null = null) {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
    }

    const wsUrl = getWsUrl(`/ws/game/${gameId}`);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to game lobby');
      this.send('JOIN', { name: playerName, token });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (e) {
        console.error('Failed to parse message', e);
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected');
    };

    this.ws.onerror = (e) => {
      console.error('WS Error', e);
      this.onError('Connection error');
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleMessage(data: any) {
    switch (data.type) {
      case 'PLAYER_JOINED':
        this.playerId = data.payload.player_id;
        this.onGameUpdate(data.payload.game);
        break;
      case 'GAME_UPDATE':
        this.onGameUpdate(data.payload);
        break;
      case 'COUNTDOWN':
        console.log('Countdown:', data.payload.seconds);
        break;
      case 'QUESTION_COUNTDOWN':
        if (this.onQuestionCountdown) {
          this.onQuestionCountdown(data.payload.seconds);
        }
        break;
      case 'ERROR':
        this.onError(data.payload);
        break;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  public setReady(isReady: boolean) {
    this.send('READY', { is_ready: isReady });
  }

  public startGame() {
    this.send('START_GAME', {});
  }

  public submitAnswer(value: number) {
    this.send('SUBMIT_ANSWER', { value });
  }

  public getPlayerId() {
    return this.playerId;
  }
}
