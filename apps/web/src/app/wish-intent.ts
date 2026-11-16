// A wish typed on the home screen travels to the plan screen in memory only:
// the text of a wish never goes into the address (docs/ux/information-architecture.md, question 6).
let pending: string | undefined

export function setPendingWish(text: string): void {
  pending = text
}

export function takePendingWish(): string | undefined {
  const text = pending
  pending = undefined
  return text
}
