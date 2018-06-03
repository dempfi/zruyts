import * as natural from 'natural'
import * as compromise from 'compromise'
import * as winkStem from 'wink-porter2-stemmer'

export const normalize = (sentence: string): string =>
  compromise(sentence).normalize().out()

export const tokenize = (sentence: string): string[] =>
  new natural.WordTokenizer().tokenize(normalize(sentence))

export const stem = (sentence: string): string[] =>
  tokenize(sentence).map(winkStem)

export const uniq = <T>(arr: T[]): T[] => {
  const result: T[] = []
  for (const el of arr)
    if (!result.includes(el))
      result.push(el)
  return result
}

export const cloneArray = <T>(arr: T[]): T[] =>
  [].concat(arr)
