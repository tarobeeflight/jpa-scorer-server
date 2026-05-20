import type { PoolConnection } from "mysql2/promise";
import { mysqlClient } from "./mysql.client.js";

export class MysqlDao {
  private sql: string = '';
  private params: Map<string, any> = new Map();
  private batchSql: string = '';
  private batchParams: Map<string, any>[] = [];
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
    this.params.set(key, value ?? null);
  }

  /**
   * バッチ用SQLセット
   */
  setBatchSql(sql: string): void {
    this.batchSql = sql;
  }

  /**
   * バッチ用パラメータ追加
   */
  addBatch(): void {
    this.batchParams.push(new Map(this.params));
    this.clear();
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

      const { query, params } = this.prepareQuery(this.sql, this.params);

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

      const { query, params } = this.prepareQuery(this.sql, this.params);

      console.log('--- SQL Log ---');
      console.log('Query:', query);
      console.log('Params:', params);

      return await mysqlClient.executeNonQuery(this.connection, query, params);
    } finally {
      this.clear();
    }
  }

  /**
   * バッチ実行
   */
  async executeBatch(): Promise<number> {
    try {
      if (!this.connection) {
        throw new Error('Connection is not established.');
      }

      if (!this.batchSql || this.batchParams.length === 0) {
        return 0;
      }

      let preparedQuery = '';
      const batchParams: any[][] = [];
      this.batchParams.forEach(param => {
        const { query, params } = this.prepareQuery(this.batchSql, param);
        preparedQuery = query;
        batchParams.push(params);
      });

      console.log('--- Batch SQL Log ---');
      console.log('Batch count:', this.batchParams.length);

      return await mysqlClient.executeBatch(this.connection, preparedQuery, batchParams);
    } finally {
      this.clear();
      this.batchSql = '';
      this.batchParams = [];
    }
  }

  private prepareQuery(sql: string, params: Map<string, any>): { query: string; params: any[] } {
    let preparedSql = String(sql);
    const preparedParams: any[] = [];
    const placeholders = sql.match(/:(\w+)\b/g);

    if (placeholders) {
      // SQL内のプレースホルダーのセットを作成
      const uniquePlaceholders = [...new Set(placeholders)];

      // SQL内のプレースホルダーを全て「?」に変換
      uniquePlaceholders.forEach((placeholder) => {
        const key = placeholder.substring(1);
        if (!params.has(key)) {
          throw new Error(`Parameter "${key}" is missing.`);
        }

        // 全置換（正規表現を使って該当するパラメータ名をすべて ? に）
        const regex = new RegExp(placeholder + '\\b', 'g');
        preparedSql = preparedSql.replace(regex, '?');
      });

      // プレースホルダーの順番通りにパラメータの値を収集
      placeholders.forEach(m => {
        preparedParams.push(params.get(m.substring(1)));
      });
    }
    return { query: preparedSql, params: preparedParams };
  }

  private clear(): void {
    this.sql = '';
    this.params.clear();
  }
}