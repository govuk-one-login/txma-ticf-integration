import { EventBridgeEvent } from 'aws-lambda'

export const handler = async (
  event: EventBridgeEvent<'Athena Query State Change', 'currentState'>
): Promise<void> => {
  console.log(event)
}
