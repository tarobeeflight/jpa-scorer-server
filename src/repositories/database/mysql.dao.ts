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
   * IN句を生成しSQLを置換する
   * パラメータの要素数分プレースホルダーを生成する
   * 要素が空の場合、「1=1」で置換する
   * パラメータも自動セットする
   */
  addInClauseParam(column: string, inClausePlaceholder: string, paramPlaceholder: string, param: string[] | number[]): void {
    if (!inClausePlaceholder || !paramPlaceholder || !param || param.length === 0) {
      this.sql = this.sql.replace(`:${inClausePlaceholder}`, '1 = 1');
      return;
    }
    const placeholders = param.map((val, index) => {
      const paramKey = `${paramPlaceholder}${index + 1}`;
      this.addParam(paramKey, val);
      return `:${paramKey}`;
    }).join(', ');
    this.sql = this.sql.replace(`:${inClausePlaceholder}`, `${column} IN (${placeholders})`);
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
   * パラメータセット
   * インサートで固定の値をセットする
   */
  addInsertParam(userId: string, kinoId: any): void {
    this.params.set('INSERTUSERID', userId);
    this.params.set('INSERTKINOID', kinoId);
    this.params.set('UPDATEUSERID', userId);
    this.params.set('UPDATEKINOID', kinoId);
  }

  /**
   * パラメータセット
   * アップデートで固定の値をセットする
   */
  addUpdateParam(userId: string, kinoId: any): void {
    this.params.set('UPDATEUSERID', userId);
    this.params.set('UPDATEKINOID', kinoId);
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
    try {
      if (!this.connection) {
        throw new Error('Connection is not established.');
      }

      const { query, params } = this.prepareQuery();

      console.log('--- SQL Log ---');
      console.log('Query:', query);
      console.log('Params:', params);

      return await mysqlClient.executeQuery<T>(this.connection, query, params);
    } finally {
      this.clear();
    }
  }

  /**
   * INSERT/UPDATE/DELETE実行
   */
  async executeNonQuery(): Promise<number> {
    try {
      if (!this.connection) {
        throw new Error('Connection is not established.');
      }

      const { query, params } = this.prepareQuery();

      console.log('--- SQL Log ---');
      console.log('Query:', query);
      console.log('Params:', params);

      return await mysqlClient.executeNonQuery(this.connection, query, params);
    } finally {
      this.clear();
    }
  }

  private prepareQuery(): { query: string; params: any[] } {
    let preparedSql = this.sql;
    const params: any[] = [];
    const matches = this.sql.match(/:(\w+)\b/g);

    if (matches) {
      // 重複を排除してループ（同じパラメータが複数回使われるケース対応）
      const uniqueMatches = [...new Set(matches)];

      uniqueMatches.forEach((match) => {
        const key = match.substring(1);
        if (!this.params.has(key)) {
          throw new Error(`Parameter "${key}" is missing.`);
        }

        // 全置換（正規表現を使って該当するパラメータ名をすべて ? に）
        const regex = new RegExp(match + '\\b', 'g');
        preparedSql = preparedSql.replace(regex, '?');
      });

      // パラメータの値を順番通りに再収集
      const orderedMatches = this.sql.match(/:(\w+)\b/g);
      orderedMatches?.forEach(m => {
        params.push(this.params.get(m.substring(1)));
      });
    }
    return { query: preparedSql, params };
  }

  private clear(): void {
    this.sql = '';
    this.params.clear();
  }
}