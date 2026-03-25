import type { CustomMatcher } from 'aws-sdk-client-mock-vitest'

declare module '@vitest/expect' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion<R = unknown> extends CustomMatcher<R> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends CustomMatcher {}
}

export {}
