type DateFormat = 'yyyyMMdd' | 'yyyy-MM-dd';

export class DateUtil {

    static toDate(dateStr: string, format: DateFormat): Date {
        // 形式チェック
        const regexMap: Record<DateFormat, RegExp> = {
            'yyyyMMdd': /^\d{8}$/,
            'yyyy-MM-dd': /^\d{4}-\d{2}-\d{2}$/
        };

        if (!regexMap[format].test(dateStr)) {
            throw new Error(`Invalid date format. Expected ${format}, but received: "${dateStr}"`);
        }

        let year: number, month: number, day: number;

        // パース処理
        if (format === 'yyyy-MM-dd') {
            const parts = dateStr.split('-');
            year = parseInt(parts[0]!, 10);
            month = parseInt(parts[1]!, 10) - 1;
            day = parseInt(parts[2]!, 10);
        } else {
            year = parseInt(dateStr.substring(0, 4), 10);
            month = parseInt(dateStr.substring(4, 6), 10) - 1;
            day = parseInt(dateStr.substring(6, 8), 10);
        }

        // 日付としての妥当性チェック (例: 2月31日などを防ぐ)
        const date = new Date(year, month, day);
        if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
            throw new Error(`Invalid date values. The date "${dateStr}" does not exist.`);
        }

        return date;
    }

    static toYYYYMMDD(date: Date): string {
        const yyyy = date.getFullYear();
        const mm = ('0' + (date.getMonth() + 1)).slice(-2);
        const dd = ('0' + date.getDate()).slice(-2);
        return `${yyyy}${mm}${dd}`;
    }
}

export const dateUtil = new DateUtil();