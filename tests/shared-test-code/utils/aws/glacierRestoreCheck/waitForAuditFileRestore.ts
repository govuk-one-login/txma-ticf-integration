import { pause } from '../../helpers'
import { auditFileIsRestoring } from './auditFileIsRestoring'

export const waitForAuditFileRestore = async (
  testDataFileKey: string
): Promise<boolean> => {
  let auditFileRestoringStatusFound = false
  for (let i = 1; i <= 10; i++) {
    auditFileRestoringStatusFound = await auditFileIsRestoring(testDataFileKey)
    if (auditFileRestoringStatusFound) {
      console.log(
        `File ${testDataFileKey} has started restoring, test complete`
      )
      break
    }
    console.log(
      `File ${testDataFileKey} has not started restoring yet, waiting 2 seconds. Attempt ${i}`
    )
    await pause(2000)
  }
  return auditFileRestoringStatusFound
}
