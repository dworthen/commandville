import multipipe from 'multipipe'
import { Duplex } from 'stream'

export function pipeline(...streams: Duplex[]): Duplex {
  return multipipe(...streams)
}
