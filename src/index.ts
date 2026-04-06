import 'dotenv/config'; // 最初に.envファイルから環境変数を読み込む
import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { redisClient } from './repositories/cache/redis.client.js';
import { scoreController } from './controllers/score.controller.js';
import { playerController } from './controllers/player.controller.js';

const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:4200';

const app: Application = express();
// CORSミドルウェアの設定
// 指定されたオリジンからのリクエストのみを許可する
app.use(cors({ origin: ALLOWED_ORIGIN }));
// HTTPリクエストのボディをJSONとしてパースするミドルウェア
// これにより、req.bodyでJSONデータにアクセス可能になる
app.use(express.json());

// Redis接続
await redisClient.connect();

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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});