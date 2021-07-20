import { Duplex, PassThrough } from 'stream'

export type Predicate = () => boolean
export interface Condition {
  condition: Predicate | boolean
  pipeline: Duplex
}

function isTrue(condition: Predicate | boolean): boolean {
  return typeof condition === 'function' ? condition() : condition
}

export function branch(...conditions: Condition[]): Duplex {
  for (const { condition, pipeline } of conditions) {
    if (isTrue(condition)) {
      return pipeline
    }
  }
  return new PassThrough({ objectMode: true })
}
