import mysql from 'mysql2/promise';

export class MySQLClient {
  private pool: mysql.Pool;

  constructor() {
    // .env から設定を読み込み
    this.pool = mysql.createPool({
      host: process.env['MYSQL_HOST'] || 'localhost',
      user: process.env['MYSQL_USER'] || 'root',
      password: process.env['MYSQL_PASSWORD'] || 'password',
      database: process.env['MYSQL_DATABASE'] || 'jpa_scorer_db',
      port: Number(process.env['MYSQL_PORT']) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  /**
   * クエリ実行用メソッド
   */
  async execute<T>(sql: string, params?: any[]): Promise<T> {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows as T;
    } catch (error) {
      console.error('Database Query Error:', error);
      throw error;
    }
  }

  /**
   * トランザクションが必要な場合に使用
   */
  async getConnection(): Promise<mysql.PoolConnection> {
    return await this.pool.getConnection();
  }
}

export const mysqlClient = new MySQLClient();