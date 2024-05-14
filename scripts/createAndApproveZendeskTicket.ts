import { makeApproveZendeskTicketRequest } from '../tests/shared-test-code/utils/zendesk/approveZendeskTicket'
import { createZendeskTicket } from '../tests/shared-test-code/utils/zendesk/createZendeskTicket'
import { getEnv } from '../tests/shared-test-code/utils/helpers'
import { ZendeskRequestData } from '../tests/shared-test-code/types/zendeskRequestData'
import { zendeskConstants } from '../tests/shared-test-code/constants/zendeskParameters'

const generateTicketData = (): ZendeskRequestData => ({
  request: {
    subject: getEnv('FIXED_SUBJECT_LINE'),
    ticket_form_id: zendeskConstants.piiFormId,
    custom_fields: [
      {
        id: zendeskConstants.fieldIds.identifier,
        value: 'event_id'
      },
      {
        id: zendeskConstants.fieldIds.eventIds,
        value: getEnv('OVERRIDE_EVENT_IDS')
      },
      {
        id: zendeskConstants.fieldIds.requestDate,
        value: getEnv('FIXED_DATA_REQUEST_DATE')
      },
      {
        id: zendeskConstants.fieldIds.piiTypes,
        value: ['drivers_licence']
      },
      {
        id: zendeskConstants.fieldIds.customDataPath,
        value: getEnv('DATA_PATHS')
      },
      {
        id: zendeskConstants.fieldIds.recipientEmail,
        value: getEnv('FIXED_RECIPIENT_EMAIL')
      },
      {
        id: zendeskConstants.fieldIds.recipientName,
        value: 'Test User'
      }
    ],
    comment: {
      body: 'PII request created by command-line tool'
    }
  }
})

const createAndApproveTicket = async () => {
  checkEnvironmentVariablesSet([
    'FIXED_SUBJECT_LINE',
    'FIXED_RECIPIENT_EMAIL',
    'DATA_PATHS',
    'FIXED_DATA_REQUEST_DATE',
    'OVERRIDE_EVENT_IDS'
  ])
  const ticketData = generateTicketData()
  console.log('creating ticket with data', JSON.stringify(ticketData, null, 2))
  const ticketId = await createZendeskTicket(ticketData)
  await makeApproveZendeskTicketRequest(ticketId)
  console.log(`approved ticket with id ${ticketId}`)
}

const checkEnvironmentVariablesSet = (environmentVariables: string[]) =>
  environmentVariables.forEach((v) => checkRequiredEnvironmentVariableSet(v))

const checkRequiredEnvironmentVariableSet = (environmentVariable: string) => {
  if (!process.env[environmentVariable]) {
    throw new Error(
      `Must set the environment variable ${environmentVariable} in your shell when calling this utility`
    )
  }
}

createAndApproveTicket().catch((err) => {
  console.log('Error', err)
  process.exit(1)
})
