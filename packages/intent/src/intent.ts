import { Dataset } from './dataset'
import { Model, Settings } from './model'

export class Intent {
  static from(utterances: string[], label?: string) {
    const intent = new Intent(label)
    Dataset.add(intent, utterances)
    return intent
  }

  static match(utterance: string) {
    const input = Dataset.input(utterance)
    const activation = Model.network.activate(input)
    return activation
      .map((value, index) => ({ value, intent: Dataset.intents[index] }))
      .filter(({ value }) => value > 0.25)
      .sort((a, b) => b.value - a.value)
  }

  static learn(settings?: Settings) {
    return Model.learn(settings)
  }

  private constructor(public label?: string) { }

  isMatch(utterance: string) {
    return Intent.match(utterance).some(i => i.intent === this)
  }

  toString() {
    return `Intent{${this.label || 'anonymus'}}`
  }
}
