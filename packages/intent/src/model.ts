import { Architect, Trainer } from 'synaptic'
import { Dataset } from './dataset'
import { Intent } from './intent'

export const SETTINGS = {
  iterations: 10000,
  shuffle: true,
  error: .009,
  rate: .3
}

export type Settings = Partial<typeof SETTINGS>

export class Model {
  static trainer: Trainer
  static network: Architect.Perceptron

  static learn(settings?: Settings) {
    const { tokens, intents } = Dataset
    const inNodes = tokens.length
    const outNodes = intents.length
    Model.network = new Architect.Perceptron(inNodes, outNodes + 5, outNodes)
    Model.trainer = new Trainer(Model.network)
    Model.trainer.train(Dataset.trainingData, { ...SETTINGS, ...settings })
  }
}
