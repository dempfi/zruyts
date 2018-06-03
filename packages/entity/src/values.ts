import * as c from 'compromise'

export type Value = {
  number: number
  unit?: string
}

const parseValue = (d): Value => ({
  unit: d.unit ? d.unit : undefined,
  number: d.number
})

export const values = (str: string): Value[] =>
  c(str).values().data().map(parseValue)
