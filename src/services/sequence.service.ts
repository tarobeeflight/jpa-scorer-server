import { MysqlDao } from '../repositories/database/mysql.dao.js';
import type { Sequence } from '../types/sequence.type.js';
import { DateUtil } from '../utils/date.util.js';

export class SequenceService {
    async get(sequenceKbn: string, date: Date): Promise<string> {
        const selectSql =
            "SELECT /*シーケンス取得*/ "
            + "    CONCAT( "
            + "        date, "
            + "        LPAD(sequence_value, 4, '0') "
            + "    ) as sequence_value "
            + "FROM "
            + "    m_sequence "
            + "WHERE "
            + "    1 = 1 "
            + "    AND sequence_kbn = :SEQUENCEKBN "
            + "    AND date = :DATE ";

        const countupSql =
            "INSERT /*シーケンスカウントアップ*/ INTO "
            + "    m_sequence( "
            + "        sequence_kbn, "
            + "        date, "
            + "        sequence_value "
            + "    ) VALUES ( "
            + "        :SEQUENCEKBN, "
            + "        :DATE, "
            + "        1 "
            + "    ) "
            + "ON DUPLICATE KEY UPDATE "
            + "    sequence_value = sequence_value + 1 "

        const dao = new MysqlDao();

        try {
            // 接続
            await dao.connect();
            // ----------------------------------
            // シーケンスカウントアップ
            // ----------------------------------
            dao.setSql(countupSql);
            dao.addParam('SEQUENCEKBN', sequenceKbn);
            dao.addParam('DATE', DateUtil.toYYYYMMDD(date));
            await dao.executeNonQuery();
            // ----------------------------------
            // シーケンス取得
            // ----------------------------------
            dao.setSql(selectSql);
            dao.addParam('SEQUENCEKBN', sequenceKbn);
            dao.addParam('DATE', DateUtil.toYYYYMMDD(date));
            const sequenceList = await dao.executeQuery<Sequence>();

            const sequenceValue = sequenceList.at(0)!.sequenceValue!;
            dao.commit();

            return sequenceValue;

        } catch (error) {
            dao.rollback();
            throw error;
        } finally {
            // 解放
            await dao.release();
        }
    }


}

// シングルトンとしてエクスポート
export const sequenceService = new SequenceService();