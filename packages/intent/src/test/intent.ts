// tslint:disable
import test from 'ava'
import { Intent } from '../'

const testCases = [
  {
    label: 'greetings',
    patterns: ['hi', 'hello', 'is anyone there?', 'good day'],
    tests: ['hi there']
  },
  {
    label: 'capablities',
    patterns: ['what are you capable of?', 'can you play'],
    tests: ['what you can play for me?']
  },
  {
    label: 'bye',
    patterns: ['bye', 'see you later', 'goodbye'],
    tests: ['thanks, bye', 'thanks, see you!']
  },
  {
    label: 'music',
    patterns: ['play music'],
    tests: ['play some jazz music for me, will ya?']
  },
  {
    label: 'movie',
    patterns: ['play movie', 'watch a movie with Robert de Niro'],
    tests: ['I want to watch a movie with Charlie Sean']
  },
  {
    label: 'play',
    patterns: ['play movie', 'play music'],
    tests: ['play some rock music']
  }
]

const negatives = ['fuck off', 'i don\'t care']

const intents: Intent[] = []

test.before(_ => {
  for (const { patterns, label } of testCases)
    intents.push(Intent.from(patterns, label))
  Intent.learn()
})

test('Intnets should match', t =>
  testCases.forEach(({ tests, label }, index) => {
    tests.forEach(test => {
      const matches = Intent.match(test)
      const matchedLabels = matches.map(c => `${c.intent} - ${c.value.toFixed(2)}`)
      const errorMessage = `"${test}" didn't match "${label}"; Matches are "${matchedLabels.join(', ')}"`
      console.log(`Case: "${test}", Matches: "${matchedLabels.join(', ')}"`)
      t.true(matches.some(m => m.intent === intents[index]), errorMessage)
    })
  }))

test('Intnets should not match', t =>
  negatives.forEach(test => {
    const matches = Intent.match(test)
    const matchedLabels = matches.map(c => `${c.intent} - ${c.value.toFixed(2)}`)
    console.log(`Case: "${test}", Matches: "${matchedLabels.join(', ')}"`)
    t.is(matches.length, 0)
  }))
