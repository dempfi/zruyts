export * from './people'
export * from './values'
import * as c from 'compromise'

const normal = (d: { normal: string }): string => d.normal

export const places = (str: string): string[] =>
  c(str).places().data().map(normal)

export const organizations = (str: string): string[] =>
  c(str).organizations().data().map(normal)

export const urls = (str: string): string[] =>
  c(str).urls().data().map(normal)
