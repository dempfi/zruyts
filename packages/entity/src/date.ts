import * as c from 'compromise'

type Parsed = {
  date?: null
  month?: null
  named?: 'yesterday' | 'today'
  weekday?: null
  time?: null
  year?: null
}

const buildDate = (obj: Parsed): Date => {
  const date = new Date()
  if (obj.date) date.setDate(obj.date)
  if (obj.month) date.setMonth(obj.month)
  if (obj.year) date.setFullYear(obj.year)
  return date
}

export const date = (str: string) =>
  c(str).toLowerCase().dates().data().map(buildDate)
