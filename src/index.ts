import 'dotenv/config'; // 最初に.envファイルから環境変数を読み込む
import express from 'express';
import type { Application, Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { redisClient } from './repositories/cache/redis.client.js';
import { playerController } from './controllers/player.controller.js';
import { matchController } from './controllers/match.controller.js';
import { appUtil } from './utils/app.util.js';
import { teamController } from './controllers/team.controller.js';
import { scoreController } from './controllers/score.controller.js';

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

// 初期化
await appUtil.init();

// --- WebSocket ロジック ---
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // コントローラーでイベントを登録
  matchController.attachSocketEvents(socket, io);
  scoreController.attachSocketEvents(socket, io);


  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// todo : コントローラーにappを渡してAPIエンドポイントを移動したい

// ------------------------------------------------------
// GET
// ------------------------------------------------------
// /api/match/list
app.get('/api/match/list', (req: Request, res: Response) => matchController.getMatchList(req, res));
// /api/team/list
app.get('/api/team/list', (req: Request, res: Response) => teamController.get(req, res));
// /api/player-info/init/:matchId/:gameNo
app.get('/api/player-info/init/:matchId/:gameNo', (req: Request, res: Response) => matchController.getPlayerInfoInit(req, res));

// ------------------------------------------------------
// POST
// ------------------------------------------------------
// /api/game/update/player エンドポイントの定義
app.post('/api/game/update/player', (req: Request, res: Response) => matchController.updatePlayerOnGame(req, res, io));
// /api/score/update エンドポイントの定義
// app.post('/api/score/update', (req: Request, res: Response) => scoreController.updateActionHistory(req, res));


// POST /api/match/create エンドポイントの定義
app.post('/api/match/create', (req: Request, res: Response) => matchController.create(req, res, io));

// サーバーの起動
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});