// Based on https://github.com/Orbiit/gunn-web-app/blob/master/js/date.js

export const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * A 7-item list from 0 to 6, representing the week day numbers of a week
 * starting on a Sunday.
 */
export const DAY_NUMS = [0, 1, 2, 3, 4, 5, 6]

/**
 * A single, unified Day object representing a day (no time). Months are
 * 1-indexed.
 */
export class Day {
  #date: Date

  constructor (utcDate: Date) {
    this.#date = utcDate
  }

  get year (): number {
    return this.#date.getUTCFullYear()
  }

  get month (): number {
    return this.#date.getUTCMonth() + 1
  }

  /** @param length - Defaults to `long`. */
  monthName (
    length: Intl.DateTimeFormatOptions['month'] = 'long',
    locales?: string | string[]
  ): string {
    return new Intl.DateTimeFormat(locales, {
      timeZone: 'UTC',
      month: length
    }).format(this.#date)
  }

  get date (): number {
    return this.#date.getUTCDate()
  }

  /** Day of the week. */
  get day (): number {
    return this.#date.getUTCDay()
  }

  /** @param length - Defaults to `long`. */
  dayName (
    length: Intl.DateTimeFormatOptions['weekday'] = 'long',
    locales?: string | string[]
  ): string {
    return new Intl.DateTimeFormat(locales, {
      timeZone: 'UTC',
      weekday: length
    }).format(this.#date)
  }

  /**
   * Returns an arbitrary identifier for the date, the number of days between
   * the Unix epoch and this date. It should be unique per date, so it can be
   * used as an ID.
   */
  get id (): number {
    return this.#date.getTime() / MS_PER_DAY
  }

  /**
   * Returns the Sunday of a week beginning on Sunday (i.e. returns the last
   * Sunday), which can be used to get a unique ID for a week.
   */
  get sunday (): Day {
    return this.last(0)
  }

  /**
   * Like `sunday`, returns the Monday of a week beginning on Monday (i.e. the
   * last Monday).
   */
  get monday (): Day {
    return this.last(1)
  }

  get valid (): boolean {
    return !Number.isNaN(this.#date.getTime())
  }

  /**
   * Return a new `Day` that is `days` days after this date.
   */
  add (days: number): Day {
    const clone = new Date(this.#date)
    clone.setUTCDate(this.date + days)
    return new Day(clone)
  }

  /**
   * Returns the last day that falls on the given day of the week. For example,
   * `last(3)` returns the last Wednesday. If `this` is Wednesday, then `last`
   * returns `this`.
   */
  last (day: number): Day {
    const offset = day - this.day
    if (offset === 0) {
      return this
    } else if (offset < 0) {
      // Earlier in the week
      return this.add(offset)
    } else {
      // Last week
      return this.add(offset - 7)
    }
  }

  /**
   * Converts the Date to the date in local time at the start of the day.
   */
  toLocal (): Date {
    return new Date(this.year, this.month - 1, this.date)
  }

  /**
   * Formats the date with `toLocaleDateString` according to `args`. The
   * `timeZone` option is ignored because the internal `Date` object is in UTC.
   * If no arguments are given, it defaults to the ISO 8601 representation of
   * the date: `YYYY-MM-DD`.
   */
  toString (...args: Parameters<Date['toLocaleDateString']>): string {
    return args.length > 0
      ? this.#date.toLocaleDateString(args[0], { ...args[1], timeZone: 'UTC' })
      : this.valid
      ? [
          this.year.toString().padStart(4, '0'),
          this.month.toString().padStart(2, '0'),
          this.date.toString().padStart(2, '0')
        ].join('-')
      : 'Invalid date'
  }

  /**
   * Returns the day ID (see `Day#dayId`). JS calls this implicitly for things
   * like comparisons, so you can directly compare a `Day`.
   */
  valueOf (): number {
    return this.id
  }

  toJSON (): string {
    return this.toString()
  }

  [Symbol.for('Deno.customInspect')] (): string {
    return this.toString()
  }

  static get EPOCH (): Day {
    return new Day(new Date(0))
  }

  /** `month` is 1-indexed. */
  static from (year: number, month: number, date: number): Day {
    const dateObj = new Date(Date.UTC(year, month - 1, date))
    if (year < 100) {
      // Two-digit years are assumed to be in 1900
      dateObj.setUTCFullYear(year)
    }
    return new Day(dateObj)
  }

  /** Creates a `Day` from a `Date` using the client's local time. */
  static fromLocal (date: Date): Day {
    return Day.from(date.getFullYear(), date.getMonth() + 1, date.getDate())
  }

  static today (): Day {
    return Day.fromLocal(new Date())
  }

  static parse (str: string): Day | null {
    const [year, month, date] = str.split('-').map(Number)
    const parsed = Day.from(year, month, date)
    return parsed.valid ? parsed : null
  }

  static fromId (dayId: number): Day {
    return Day.EPOCH.add(dayId)
  }

  /**
   * @param month - 1-indexed.
   * @param length - Defaults to `long`.
   */
  static monthName (
    month: number,
    length: Intl.DateTimeFormatOptions['month'] = 'long',
    locales?: string | string[]
  ): string {
    return this.from(1970, month, 1).monthName(length, locales)
  }

  /**
   * @param day - If over 7, then the value will be modulo'd by 7.
   */
  static dayName (
    day: number,
    length: Intl.DateTimeFormatOptions['weekday'] = 'long',
    locales?: string | string[]
  ): string {
    // 1970-01-04 is a Sunday
    return this.from(1970, 1, 4 + day).dayName(length, locales)
  }

  static min (first: Day | Day[], ...rest: Day[]) {
    const days = Array.isArray(first) ? [...first, ...rest] : [first, ...rest]
    return this.fromId(
      days.reduce((cum, curr) => Math.min(cum, curr.id), Infinity)
    )
  }

  static max (first: Day | Day[], ...rest: Day[]) {
    const days = Array.isArray(first) ? [...first, ...rest] : [first, ...rest]
    return this.fromId(
      days.reduce((cum, curr) => Math.max(cum, curr.id), -Infinity)
    )
  }
}
