import 'dotenv/config'; // 最初に.envファイルから環境変数を読み込む
import express from 'express';
import type { Application, Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { redisClient } from './repositories/cache/redis.client.js';
import { scoreController } from './controllers/score.controller.js';
import { playerController } from './controllers/player.controller.js';
import type { Action } from './types/action.type.js';

const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:4200';

const app: Application = express();
const httpServer = createServer(app);

// Socket.ioの初期化
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"]
  }
});

// CORSミドルウェアの設定
// 指定されたオリジンからのリクエストのみを許可する
app.use(cors({ origin: ALLOWED_ORIGIN }));
// HTTPリクエストのボディをJSONとしてパースするミドルウェア
// これにより、req.bodyでJSONデータにアクセス可能になる
app.use(express.json());

// Redis接続
await redisClient.connect();

// --- WebSocket ロジック ---
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 試合ごとのルームに参加（JPAの試合IDなどを想定）
  socket.on('join-match', (data: {matchId: string, gameNo: number}) => {
    socket.join(data.matchId + '-' + data.gameNo);
    console.log(`User ${socket.id} joined match: ${data.matchId}, game: ${data.gameNo}`);
  });

  // スコア更新イベントの受信
  socket.on('update-score', (data: { matchId: string, gameNo: number, history: Action[] }) => {
    // 同じ matchId のルームにいる全員（自分以外）に通知
    socket.to(data.matchId + '-' + data.gameNo).emit('score-broadcast', data.history);
    console.log(`Score updated for match ${data.matchId} game ${data.gameNo}: `, data.history);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

export type ServerStatus = {
  status: string;
  message: string;
  timestamp: string;
}

// POST /api/player/resister エンドポイントの定義
app.post('/api/player/resister', (req: Request, res: Response) => playerController.register(req, res));

// POST /api/score/update エンドポイントの定義
app.post('/api/score/update', (req: Request, res: Response) => scoreController.updateActionHistory(req, res));

// サーバーの起動
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});