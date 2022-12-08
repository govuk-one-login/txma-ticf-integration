import { ZendeskWebhookRequest } from '../../types/zendeskWebhookRequest'
import { ticketIdToResponseMapping } from './ticketIdToResponseMapping'

export const getTicketDetailsForId = (
  testCaseNumber: number
): ZendeskWebhookRequest => {
  const mappedTestCase = ticketIdToResponseMapping[testCaseNumber]
  if (!mappedTestCase) {
    throw new Error(`No test case found for test case number ${testCaseNumber}`)
  }
  return mappedTestCase
}
