@commandville/transform

# @commandville/transform

## Table of contents

### Type aliases

- [Flusher](api.md#flusher)
- [Transformer](api.md#transformer)

### Functions

- [transform](api.md#transform)

## Type aliases

### Flusher

Ƭ **Flusher**<`R`\>: () => `R` \| `Promise`<`R`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `R` | `unknown` |

#### Type declaration

▸ (): `R` \| `Promise`<`R`\>

##### Returns

`R` \| `Promise`<`R`\>

#### Defined in

[index.ts:4](https://github.com/dworthen/commandville/blob/bf72340/packages/transform/src/index.ts#L4)

___

### Transformer

Ƭ **Transformer**<`T`, `R`\>: (`chunk`: `T`) => `R` \| `Promise`<`R`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `unknown` |
| `R` | `unknown` |

#### Type declaration

▸ (`chunk`): `R` \| `Promise`<`R`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `chunk` | `T` |

##### Returns

`R` \| `Promise`<`R`\>

#### Defined in

[index.ts:3](https://github.com/dworthen/commandville/blob/bf72340/packages/transform/src/index.ts#L3)

## Functions

### transform

▸ **transform**<`T`, `R1`, `R2`\>(`transformer?`, `flusher?`): `Duplex`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `unknown` |
| `R1` | `unknown` |
| `R2` | `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `transformer?` | [`Transformer`](api.md#transformer)<`T`, `R1`\> |
| `flusher?` | [`Flusher`](api.md#flusher)<`R2`\> |

#### Returns

`Duplex`

#### Defined in

[index.ts:6](https://github.com/dworthen/commandville/blob/bf72340/packages/transform/src/index.ts#L6)
