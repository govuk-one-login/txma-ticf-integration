import { when } from 'jest-when'
import { parseCliCallerForTesting } from './cli'
import * as initiateCopyAndDecryptActionFile from './initiateCopyAndDecrypt/manualAuditDataRequestInitiateCopyAndDecryptAction'
import { initiateCopyAndDecryptAction } from './initiateCopyAndDecrypt/manualAuditDataRequestInitiateCopyAndDecryptAction'

const argvBase = ['path_to_node', 'scripts/cli.ts']
export const retrieveAuditDataCommandBase = argvBase
  .slice()
  .concat(['retrieve-audit-data'])

describe('testing command: retrieve-audit-data', () => {
  beforeEach(() => {
    // jest.clearAllMocks()
    jest.resetAllMocks()
    jest.spyOn(initiateCopyAndDecryptActionFile, 'initiateCopyAndDecryptAction')
  })

  type happyPath = {
    cliParams: string[]
    parsedCliParams: initiateCopyAndDecryptActionFile.initiateCopyAndDecrypActionTypes
  }

  const table: happyPath[] = [
    {
      cliParams: retrieveAuditDataCommandBase
        .slice()
        .concat(['zendeskId123', '--dates', '2023-11-11', '2023-11-12']),
      parsedCliParams: {
        zendeskId: 'zendeskId123',
        daterange: undefined,
        dates: ['2023-11-11', '2023-11-12']
      }
    },
    {
      cliParams: retrieveAuditDataCommandBase
        .slice()
        .concat(['zendeskId456', '--dates', '2023-01-01']),
      parsedCliParams: {
        zendeskId: 'zendeskId456',
        daterange: undefined,
        dates: ['2023-01-01']
      }
    }
  ]

  it.each(table)(
    'retrieve-audit-data happy path. Test case %#',
    ({ cliParams, parsedCliParams }) => {
      when(initiateCopyAndDecryptAction).mockResolvedValue()
      console.log(cliParams)
      parseCliCallerForTesting(cliParams)
      expect(
        initiateCopyAndDecryptActionFile.initiateCopyAndDecryptAction
      ).toHaveBeenCalledWith(parsedCliParams)
    }
  )
})
