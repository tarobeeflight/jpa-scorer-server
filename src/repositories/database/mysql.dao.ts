import type { PoolConnection } from "mysql2/promise";
import { mysqlClient } from "./mysql.client.js";

export class MysqlDao {
  private sql: string = '';
  private params: Map<string, any> = new Map();
  private connection?: PoolConnection | undefined;

  /**
   * DB接続メソッド
   * 内部で MySQLClient を使用し、コネクションをインスタンスに保持する
   * トランザクションを開始する
   */
  async connect(): Promise<void> {
    if (!this.connection) {
      this.connection = await mysqlClient.getConnection();
    }
    await this.connection!.beginTransaction();
  }

  /**
   * SQLセット
   */
  setSql(sql: string): void {
    this.sql = sql;
  }

  /**
   * パラメータセット
   */
  addParam(key: string, value: any): void {
    this.params.set(key, value);
  }

  /**
   * コミット
   */
  async commit(): Promise<void> {
    if (this.connection) {
      await this.connection.commit();
    }
    await this.release();
  }

  /**
   * ロールバック
   */
  async rollback(): Promise<void> {
    if (this.connection) {
      await this.connection.rollback();
    }
    await this.release();
  }

  /**
   * コネクション解放
   */
  async release(): Promise<void> {
    if (this.connection) {
      this.connection.release();
      this.connection = undefined;
    }
    this.clear();
  }

  /**
   * SELECT実行
   */
  async executeQuery<T>(): Promise<T[]> {
    return await this.run<T[]>();
  }

  /**
   * INSERT/UPDATE/DELETE実行
   */
  async executeNonQuery(): Promise<any> {
    return await this.run<any>();
  }

  /**
   * 内部実行ロジック
   */
  private async run<T>(): Promise<T> {
    if (!this.connection) {
      throw new Error('Connection is not established.');
    }

    const { query, values } = this.prepareQuery();
    
    console.log('--- SQL Log ---');
    console.log('Query:', query);
    console.log('Params:', values);

    try {
      return await mysqlClient.execute<T>(this.connection, query, values);
    } finally {
      this.clear();
    }
  }

  private prepareQuery(): { query: string; values: any[] } {
    let preparedSql = this.sql;
    const values: any[] = [];
    const matches = this.sql.match(/:(\w+)/g);

    if (matches) {
      matches.forEach((match) => {
        const key = match.substring(1);
        if (!this.params.has(key)) {
          throw new Error(`Parameter "${key}" is missing.`);
        }
        preparedSql = preparedSql.replace(match, '?');
        values.push(this.params.get(key));
      });
    }
    return { query: preparedSql, values };
  }

  private clear(): void {
    this.sql = '';
    this.params.clear();
  }
}