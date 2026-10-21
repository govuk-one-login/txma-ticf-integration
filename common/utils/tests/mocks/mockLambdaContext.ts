import { Context } from 'aws-lambda'
import { vi } from 'vitest'

export const mockLambdaContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'someFunction',
  functionVersion: 'someVersion',
  invokedFunctionArn: 'someFunctionArn',
  memoryLimitInMB: '1',
  awsRequestId: 'someRequestId',
  logGroupName: 'someLogGroupName',
  logStreamName: 'someLogStreamName',
  getRemainingTimeInMillis: () => 1,
  done: vi.fn(),
  fail: vi.fn(),
  succeed: vi.fn()
}
