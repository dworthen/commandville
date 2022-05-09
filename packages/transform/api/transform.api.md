## API Report File for "@commandville/transform"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

/// <reference types="node" />

import { Transform } from 'stream';

// @public (undocumented)
export type ChunkTransformer<T = unknown, R = unknown> = (chunk: T) => R | Promise<R>;

// @public (undocumented)
export type Flusher<R = unknown> = () => R | Promise<R>;

// @public
export function transform<T = unknown, R1 = unknown, R2 = unknown>(transformer?: ChunkTransformer<T, R1>, flusher?: Flusher<R2>): Transform;

```