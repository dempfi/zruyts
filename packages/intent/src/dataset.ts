import { Intent } from './intent'
import { stem, uniq, cloneArray } from './helpers'

type Patterns = string[]
export type Document = { intent: Intent, tokens: string[] }
export type Trainset = { input: (0 | 1)[], output: (0 | 1)[] }

export class Dataset {
  static tokens: string[] = []
  static intents: Intent[] = []
  static documents: Document[] = []

  static input(sentence: string) {
    const tokens = stem(sentence)
    return this.tokens.map(s => tokens.includes(s) ? 1 : 0)
  }

  static add(intent: Intent, patterns: string[]) {
    for (const pattern of patterns) {
      const tokens = stem(pattern)
      this.tokens.push(...tokens)
      this.documents.push({ intent, tokens })
    }
    this.tokens = uniq(this.tokens)
    this.intents.push(intent)
  }

  static get trainingData() {
    const training: Trainset[] = []
    const emtpyRow: (0 | 1)[] = this.intents.map(_ => 0 as 0)

    for (const { intent, tokens } of this.documents) {
      const input = this.tokens.map(t => tokens.includes(t) ? 1 : 0)
      const output = cloneArray(emtpyRow)
      output[this.intents.indexOf(intent)] = 1
      training.push({ input, output })
    }

    return training
  }
}
