import { json } from 'node:stream/consumers';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import type { Match } from '../../types/match.type.js';

export class RedisClient {
  private client: RedisClientType;

  constructor() {
    // 環境変数から接続情報を取得
    const host = process.env['REDIS_HOST'] || 'localhost';
    const port = process.env['REDIS_PORT'] || '6379';

    this.client = createClient({
      url: `redis://${host}:${port}`,
    });

    // エラーハンドリング
    this.client.on('error', (err) => console.error('Redis Client Error', err));
  }

  /**
   * Redisに接続
   */
  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
      console.log('Connected to Redis');
    }
  }

  /**
   * データを保存
   * @param key キー
   * @param value 値（JSON文字列化して保存）
   * @param ttl 有効期限(秒) - デフォルト1日
   */
  async set(key: string, value: string, ttl: number = 86400): Promise<void> {
    await this.client.set(key, value, {
      EX: ttl
    });
  }

  /**
   * データを取得
   * @param key キー
   */
  async get<T>(key: string): Promise<T | null> {
    const valueStr = await this.client.get(key);
    return valueStr == null ? null : JSON.parse(valueStr) as T;
  }

  /**
   * データを削除
   * @param key キー
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * todo : 一旦ここに書いたが分ける
   * @param key キー
   */
  async getMatchList(): Promise<Match[]> {
    const keys = await this.client.keys('match:*');

    // データの値も取得する場合（MGET）
    const matches: Match[] = [];
    if (keys.length > 0) {
      const values = await this.client.mGet(keys);
      for (const v of values) {
        if (!v) {
          continue;
        }
        matches.push(JSON.parse(v) as Match);
      }
    }

    return matches;
  }
}

// インスタンスをエクスポート
export const redisClient = new RedisClient();