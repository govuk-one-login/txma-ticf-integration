export const pause = (delay: number): Promise<unknown> => {
  return new Promise((r) => setTimeout(r, delay))
}
