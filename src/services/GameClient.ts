import type { Game } from '../types';
import { getApiUrl, getWsUrl } from './apiConfig';
import { createdGameSchema, serverMessageSchema, type ServerMessage } from './gameSchemas';

type GameUpdateCallback = (game: Game) => void;
type ErrorCallback = (error: string) => void;
type QuestionCountdownCallback = (seconds: number) => void;

type ClientMessage =
  | { type: 'JOIN'; payload: { name: string; token: string | null } }
  | { type: 'READY'; payload: { is_ready: boolean } }
  | { type: 'START_GAME'; payload: Record<string, never> }
  | { type: 'SUBMIT_ANSWER'; payload: { value: number } };

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
    return createdGameSchema.parse(await response.json()).game_id;
  }

  public async createQuickGame(): Promise<string> {
    const url = this.apiUrl ? `${this.apiUrl}/quick-games` : '/api/quick-games';
    const response = await fetch(url, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to create quick game');
    }
    return createdGameSchema.parse(await response.json()).game_id;
  }

  public disconnect() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
  }

  public connect(gameId: string, playerName: string, token: string | null = null) {
    this.disconnect();

    const wsUrl = getWsUrl(`/ws/game/${gameId}`);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to game lobby');
      this.send({ type: 'JOIN', payload: { name: playerName, token } });
    };

    this.ws.onmessage = (event: MessageEvent<string>) => {
      let data: unknown;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.error('Failed to parse message', e);
        return;
      }

      const parsed = serverMessageSchema.safeParse(data);
      if (!parsed.success) {
        console.error('Unexpected message shape', parsed.error, data);
        return;
      }
      this.handleMessage(parsed.data);
    };

    this.ws.onclose = () => {
      console.log('Disconnected');
    };

    this.ws.onerror = (e) => {
      console.error('WS Error', e);
      this.onError('Connection error');
    };
  }

  private handleMessage(message: ServerMessage) {
    switch (message.type) {
      case 'PLAYER_JOINED':
        this.playerId = message.payload.player_id;
        this.onGameUpdate(message.payload.game);
        break;
      case 'GAME_UPDATE':
        this.onGameUpdate(message.payload);
        break;
      case 'COUNTDOWN':
        console.log('Countdown:', message.payload.seconds);
        break;
      case 'QUESTION_COUNTDOWN':
        if (this.onQuestionCountdown) {
          this.onQuestionCountdown(message.payload.seconds);
        }
        break;
      case 'ERROR':
        this.onError(message.payload);
        break;
    }
  }

  private send(message: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  public setReady(isReady: boolean) {
    this.send({ type: 'READY', payload: { is_ready: isReady } });
  }

  public startGame() {
    this.send({ type: 'START_GAME', payload: {} });
  }

  public submitAnswer(value: number) {
    this.send({ type: 'SUBMIT_ANSWER', payload: { value } });
  }

  public getPlayerId() {
    return this.playerId;
  }
}
