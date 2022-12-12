import { ZendeskWebhookRequest } from '../../shared-test-code/types/zendeskWebhookRequest'
import { zendeskTicketTestCaseToMockResponseMapping } from './zendeskTicketTestCaseToMockResponseMapping'

export const getWebhookRequestDataForTestCaseNumberAndDate = (
  testCaseNumber: number,
  requestDate: string
): ZendeskWebhookRequest => {
  const mappedTestCase =
    zendeskTicketTestCaseToMockResponseMapping[testCaseNumber]
  if (!mappedTestCase) {
    throw new Error(`No test case found for test case number ${testCaseNumber}`)
  }
  const webhookRequest = {
    ...mappedTestCase,
    dateFrom: requestDate,
    dateTo: requestDate,
    zendeskId: createUniqueTicketIdForDateWithMappingSuffix(
      testCaseNumber,
      requestDate
    )
  }

  return webhookRequest
}

const createUniqueTicketIdForDateWithMappingSuffix = (
  mappingId: number,
  date: string
) => {
  return `${date.replaceAll('-', '')}${Math.floor(
    Math.random() * 10000
  )}${mappingId.toString().padStart(2, '0')}`
}
