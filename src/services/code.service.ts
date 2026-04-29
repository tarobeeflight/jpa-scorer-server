import { MysqlDao } from '../repositories/database/mysql.dao.js';
import type { Code } from '../types/code.type.js';

export class CodeService {
    async get(codeKbn: string): Promise<Code[]> {
        const sql =
            "SELECT /*コード取得*/ "
            + "    C.code_kbn, "
            + "    C.code1, "
            + "    C.code2, "
            + "    C.code3, "
            + "    C.content1, "
            + "    C.content2, "
            + "    C.content3, "
            + "    C.content4, "
            + "    C.content5, "
            + "    C.content6, "
            + "    C.content7, "
            + "    C.content8, "
            + "    C.content9 "
            + "FROM "
            + "    m_code C "
            + "WHERE "
            + "    1 = 1 "
            + "    AND C.code_kbn = :CODEKBN ";

        const dao = new MysqlDao();

        try {
            // 接続
            await dao.connect();
            // ----------------------------------
            // 試合取得
            // ----------------------------------
            dao.setSql(sql);
            dao.addParam('CODEKBN', codeKbn);
            const codeList = await dao.executeQuery<Code>();

            return codeList;

        } catch (error) {
            throw error;
        } finally {
            // 解放
            await dao.release();
        }
    }


}

// シングルトンとしてエクスポート
export const codeService = new CodeService();