import { ZendeskRequestData } from '../../shared-test-code/types/zendeskRequestData'
import { generateCurrentDateWithOffset } from '../../shared-test-code/utils/helpers'
import { generateZendeskTicketData } from '../../shared-test-code/utils/zendesk/generateZendeskTicketData'
import { integrationTestData } from './testData'

const futureDate = generateCurrentDateWithOffset(50)

export const requestConstants: IntegrationTestRequestConstants = {
  invalid: generateZendeskTicketData({
    identifier: 'event_id',
    eventIds: '637783 3256',
    requestDate: futureDate,
    piiTypes: ['drivers_license']
  }),
  valid: generateZendeskTicketData({
    identifier: 'event_id',
    eventIds: integrationTestData.eventId,
    requestDate: integrationTestData.date,
    piiTypes: ['drivers_license']
  })
}

type IntegrationTestRequestConstants = {
  readonly invalid: ZendeskRequestData
  readonly valid: ZendeskRequestData
}
