import { when } from 'jest-when'
import { parseCliCallerForTesting } from './cli'
import * as sendAuditDataActionFile from './sendQueryResults/sendAuditDataAction'
import { sendAuditDataAction } from './sendQueryResults/sendAuditDataAction'

type unhappyPathTestCaseType = {
  arg: string[]
  testDescription: string
  expectedErrorMessage?: string
}

const argvBase = ['path_to_node', 'scripts/cli.ts']
const queryResultsCommandBase = argvBase.slice().concat(['send-query-results'])
export const retrieveAuditDataCommandBase = argvBase
  .slice()
  .concat(['retrieve-audit-data'])

jest.mock('./sendQueryResults/sendAuditDataAction', () => ({
  sendAuditDataAction: jest.fn()
}))
jest.mock(
  './initiateCopyAndDecrypt/manualAuditDataRequestInitiateCopyAndDecryptAction.ts',
  () => ({
    initiateCopyAndDecryptAction: jest.fn()
  })
)

describe('testing command: send-query-results', () => {
  beforeEach(() => {
    // jest.clearAllMocks()
    jest.resetAllMocks()
    jest.spyOn(sendAuditDataActionFile, 'sendAuditDataAction')
  })

  // testing to ensure that only the valid envs are used
  const happyPath = [
    ...['dev', 'build', 'staging', 'integration', 'production'].map((env) => {
      return {
        arg: queryResultsCommandBase
          .slice()
          .concat([
            env,
            'athenaId123',
            'zendeskId123',
            'Jon Doe',
            'john.doe@email.com'
          ]),
        testDescription: `testing command valid command with envrionment: ${env}`
      }
    })
  ]
  it.each(happyPath)(
    'Happy Path: testing send-query-results. Test case $#: $testDescription',
    ({ arg, testDescription }) => {
      console.log(testDescription)
      when(sendAuditDataAction).mockResolvedValue()
      parseCliCallerForTesting(arg)
      expect(sendAuditDataActionFile.sendAuditDataAction).toHaveBeenCalledWith({
        athenaQueryId: 'athenaId123',
        environment: arg[3],
        recipientEmail: 'john.doe@email.com',
        recipientName: 'Jon Doe',
        zendeskId: 'zendeskId123'
      })
    }
  )

  const unhappyPath: unhappyPathTestCaseType[] = [
    // commander checks for missing arguments 1st before checking if arg is valid
    ...['development', 'stg', 'int', 'production'].map((env) => {
      return {
        arg: queryResultsCommandBase
          .slice()
          .concat([
            env,
            'athenaId123',
            'zendeskId123',
            'Jon Doe',
            'john.doe@email.com'
          ]),
        testDescription: `testing command is invalid with environment ${env}`
      }
    })
  ]

  it.each(unhappyPath)(
    'Unhappy Path that raises exceptions: testing send-query-results. Test case $#: $testDescription ',
    () => {
      when(sendAuditDataAction).mockResolvedValue()
      expect(sendAuditDataActionFile.sendAuditDataAction).not.toHaveBeenCalled()
    }
  )

  const unhappyPathThatRaisesExceptions: unhappyPathTestCaseType[] = [
    {
      arg: queryResultsCommandBase.slice().concat(['dev']),
      testDescription: 'testing for missing query id',
      expectedErrorMessage: "error: missing required argument 'athenaQueryId'"
    },
    {
      arg: queryResultsCommandBase.slice().concat(['dev', 'athenaId123']),
      testDescription: 'testing for missing zendesk id',
      expectedErrorMessage: "error: missing required argument 'zendeskId'"
    },
    {
      arg: queryResultsCommandBase
        .slice()
        .concat(['dev', 'athenaId123', 'zendeskId123']),
      testDescription: 'testing for missing name',
      expectedErrorMessage: "error: missing required argument 'recipientName'"
    },
    {
      arg: queryResultsCommandBase
        .slice()
        .concat(['dev', 'athenaId123', 'zendeskId123', 'Jon Doe']),
      testDescription: 'testing for missing email',
      expectedErrorMessage: "error: missing required argument 'recipientEmail'"
    }
  ]

  it.each(unhappyPathThatRaisesExceptions)(
    'Unhappy Path that raises exceptions: testing send-query-results. Test case $#: $testDescription ',
    (testCase) => {
      when(sendAuditDataAction).mockResolvedValue()
      expect(() => parseCliCallerForTesting(testCase.arg)).toThrow(
        testCase.expectedErrorMessage
      )
      expect(sendAuditDataActionFile.sendAuditDataAction).not.toHaveBeenCalled()
    }
  )
})
