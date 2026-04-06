import mysql from 'mysql2/promise';

export class MySQLClient {
  private pool: mysql.Pool;

  constructor() {
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
   * トランザクションを開始するために、プールからコネクションを1つ貸し出す
   */
  async getConnection(): Promise<mysql.PoolConnection> {
    return await this.pool.getConnection();
  }

  /**
   * 特定のコネクションを用いてSQLを実行する
   */
  async execute<T>(conn: mysql.PoolConnection, sql: string, params?: any[]): Promise<T> {
    try {
      const [rows] = await conn.execute(sql, params);
      return rows as T;
    } catch (error) {
      console.error('Database Query Error:', error);
      throw error;
    }
  }
}

export const mysqlClient = new MySQLClient();