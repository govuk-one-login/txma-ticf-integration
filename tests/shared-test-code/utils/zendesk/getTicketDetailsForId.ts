import { ZendeskWebhookRequest } from '../../types/zendeskWebhookRequest'
import { ticketIdToResponseMapping } from './ticketIdToResponseMapping'

export const getTicketDetailsForId = (
  testCaseNumber: number,
  requestDate: string
): ZendeskWebhookRequest => {
  const mappedTestCase = ticketIdToResponseMapping[testCaseNumber]
  mappedTestCase.dateFrom = requestDate
  mappedTestCase.dateTo = requestDate
  mappedTestCase.zendeskId = createUniqueTicketIdForDateWithMappingSuffix(
    testCaseNumber,
    requestDate
  )
  if (!mappedTestCase) {
    throw new Error(`No test case found for test case number ${testCaseNumber}`)
  }
  return mappedTestCase
}

const createUniqueTicketIdForDateWithMappingSuffix = (
  mappingId: number,
  date: string
) => {
  return `${date.replaceAll('-', '')}${Math.floor(
    Math.random() * 10000
  )}${mappingId.toString().padStart(2, '0')}`
}
