import { EventBridgeEvent } from 'aws-lambda'

export const handler = async (
  event: EventBridgeEvent<'Athena Query State Change', AthenaEventDetails>
): Promise<void> => {
  console.log(event)

  const athenaQueryId = event.detail.queryExecutionId
  console.log(athenaQueryId)
}

interface AthenaEventDetails {
  versionId: string
  currentState: string
  previousState: string
  statementType: string
  queryExecutionId: string
  workgroupName: string
  sequenceNumber: string
}
