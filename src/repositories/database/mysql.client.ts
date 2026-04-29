import mysql, { type ResultSetHeader } from 'mysql2/promise';

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
  async executeQuery<T>(conn: mysql.PoolConnection, sql: string, params?: any[]): Promise<T[]> {
    try {
      // executeの戻り値配列のうち、最初の要素（結果データ）だけをrowsに代入する
      const [rows] = await conn.execute(sql, params);

      // INSERT/UPDATE/DELETEの場合は、rowsにResultSetHeader（操作した行数などのメタデータ）が入るため、そのまま返す
      // SELECTの場合は、rowsに取得したレコードが入るため処理を継続する
      if (!Array.isArray(rows)) {
        return [];
      }

      // テーブルのスネークケースをキャメルケースに変換して返す
      const camelizedRows = rows.map(row => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          // スネークケースをキャメルケースに変換して新しいオブジェクトに詰める
          const camelKey = key.replace(/_([a-z])/g, (g) => g[1]!.toUpperCase());
          newRow[camelKey] = (row as any)[key];
        });
        return newRow;
      });

      return camelizedRows as T[];
    } catch (error) {
      console.error('Database Query Error: ', error);
      throw error;
    }
  }

  async executeNonQuery(conn: mysql.PoolConnection, sql: string, params?: any[]): Promise<number> {
    try {
      const [result] = await conn.execute(sql, params);
      return (result as ResultSetHeader).affectedRows;
    } catch (error) {
      console.log('Database Execute Error: ', error);
      throw error;
    }
  }
}

export const mysqlClient = new MySQLClient();