import * as c from 'compromise'

export type People = {
  normal: string
  lastName?: string
  firstName?: string
  middleName?: string
  gender: 'male' | 'female'
  honorifics: string[]
}

const parsePeople = (d): People => ({
  normal: d.normal,
  firstName: d.firstName,
  middleName: d.middleName,
  lastName: d.lastName,
  gender: d.genderGuess.toLowerCase(),
  honorifics: d.honorifics
})

export const people = (str: string): People[] =>
  c(str).people().data().map(parsePeople)
