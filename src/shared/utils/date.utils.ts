export class DateUtils {
    /**
     * Retorna o início do dia atual (00:00:00.000)
     */
    static getStartOfToday(): Date {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return today
    }

    /**
     * Formata a data para o padrão de log imperial (Opcional)
     */
    static formatToImperial(date: Date): string {
        return date.toISOString().replace('T', ' ').split('.')[0]
    }
}