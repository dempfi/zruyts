
// const bot: any = {}
// bot
//   .hears(Play, onPlay => {
//     onPlay.and(Music, onMusic => {
//       onMusic.and(Genre).entries.any([genre, artist]).do(/* play music */),
//     })
//     onPlay.and(Movie).entries.any([director, title]).do(/* play movie */),
//     onPlay.and(Intent.Other).do( ask how to play that )
//   })
//   .hears(Pause, onPause => onPause.do(/* pause */))
//   .hears(Stop, onStop => {
//     onStop.and(Music).do(/* stop music */)
//     onStop.and(Movie).do(/* stop movie */)
//     onStop.and(Intent.Other).do(/* ask how to stop that */)
//   })


type F<T extends object> = () => T
const a = () => ({ a: '' })
const b = () => ({ b: 1 })

function anyOf<A extends object>(a: F<A>): A
function anyOf<A extends object, B extends object>(a: F<A>, b: F<B>): (A & B)
function anyOf<A extends object, B extends object, C extends object>(a: F<A>, b: F<B>, c: F<C>): (A & B & C)
function anyOf<A extends object, B extends object, C extends object, D extends object>(a: F<A>, b: F<B>, c: F<C>, d: F<D>): (A & B & C & D)
function anyOf<A extends object, B extends object, C extends object, D extends object, E extends object>(a: F<A>, b: F<B>, c: F<C>, d: F<D>, e: F<E>): (A & B & C & D & E)
function anyOf(...args) {
  return args.reduce((acc, el) => ({ ...acc, ...el() }), {})
}

const j = anyOf(a, b)
j.a.anchor('')
j.b.toFixed()
