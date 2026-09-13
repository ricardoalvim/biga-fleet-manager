export class DateUtils {
  static getStartOfToday(): Date {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }
}
