// Register the type definitions for aws-sdk-client-mock-vitest's custom
// matchers (toHaveReceivedCommandWith, toHaveReceivedCommand, etc.).
//
// Since v8 the package ships its own module augmentation of Vitest's
// `Matchers<R, T>` interface via the `/extend` entrypoint, so we simply
// reference it here instead of maintaining a hand-written augmentation
// (the previous augmentation targeted `@vitest/expect`'s `Assertion<R>`
// with the wrong arity and stopped working after the upgrade).
import 'aws-sdk-client-mock-vitest/extend'

export {}
