// minIOは一旦コピペしただけ。必要があれば修正する

import * as Minio from 'minio';
// 型としてのみ使用する場合は 'type' をつける
import type { ClientOptions } from 'minio'; 

export class MinioClient {
  private client: Minio.Client;

  constructor() {
    this.client = new Minio.Client({
      endPoint: process.env['MINIO_ENDPOINT'] || 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: process.env['MINIO_ROOT_USER'] || 'admin',
      secretKey: process.env['MINIO_ROOT_PASSWORD'] || 'password',
    });
  }

  // バケット作成の例
  async createBucketIfNotExists(bucketName: string) {
    const exists = await this.client.bucketExists(bucketName);
    if (!exists) {
      await this.client.makeBucket(bucketName, 'us-east-1');
    }
  }
}

export const minioClient = new MinioClient();