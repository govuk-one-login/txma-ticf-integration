import { EventBridgeEvent } from 'aws-lambda'

export const handler = async (
  event: EventBridgeEvent<'Athena Query State Change', 'detail'>
): Promise<void> => {
  console.log(event)

  const details = event.detail
  console.log(details)
}
