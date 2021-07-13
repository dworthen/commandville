export interface Person {
  name: string
}

export function hello(person: Person): void {
  console.log(`Hello ${person.name}`)
}
