import { transform } from '@commandville/transform'
import { Transform } from 'stream'

export type Reducer<Accumulator, Current> = (
  accumulator: Accumulator,
  current: Current,
  i: number,
) => Accumulator

export function reduce<Accumulator = any, Current = any>(
  reducer: Reducer<Accumulator, Current>,
  initial?: Accumulator,
): Transform {
  let acc: Accumulator | undefined = initial
  let i = 0
  return transform(
    (chunk) => {
      if (i === 0 && acc === undefined) {
        acc = chunk as Accumulator
      } else {
        acc = reducer(acc as Accumulator, chunk as Current, i)
      }
      i++
    },
    () => {
      return acc
    },
  )
}
