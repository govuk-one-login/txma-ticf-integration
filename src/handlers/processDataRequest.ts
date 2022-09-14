import { SQSEvent } from 'aws-lambda'

export const handler = async (event: SQSEvent) => {
  console.log('Handling data request SQS event', JSON.stringify(event, null, 2))
}
