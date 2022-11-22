import { makeApproveZendeskTicketRequest } from '../integration-tests/tests/utils/zendesk/approveZendeskTicket'
import { createZendeskTicket } from '../integration-tests/tests/utils/zendesk/createZendeskTicket'
import { ZendeskRequestData } from '../integration-tests/tests/types/zendeskRequestData'
import {
  ZendeskFormFieldIDs,
  ZENDESK_END_USER_NAME,
  ZENDESK_PII_FORM_ID
} from '../integration-tests/tests/constants/zendeskParameters'
import { getEnv } from '../integration-tests/tests/utils/helpers'

const generateTicketData = (): ZendeskRequestData => ({
  request: {
    subject: getEnv('FIXED_SUBJECT_LINE'),
    ticket_form_id: ZENDESK_PII_FORM_ID,
    custom_fields: [
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_FIELD_ID,
        value: 'event_id'
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_EVENT_ID_LIST_FIELD_ID,
        value: getEnv('OVERRIDE_EVENT_IDS')
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID,
        value: getEnv('FIXED_DATA_REQUEST_DATE')
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUESTED_PII_TYPE_FIELD_ID,
        value: ['drivers_license']
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_CUSTOM_DATA_PATH_FIELD_ID,
        value: getEnv('DATA_PATHS')
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_EMAIL,
        value: getEnv('ZENDESK_RECIPIENT_EMAIL')
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_NAME,
        value: ZENDESK_END_USER_NAME
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
    'ZENDESK_RECIPIENT_EMAIL',
    'DATA_PATHS',
    'FIXED_DATA_REQUEST_DATE',
    'OVERRIDE_EVENT_IDS'
  ])
  const ticketData = generateTicketData()
  console.log(`creating ticket with data ${JSON.stringify(ticketData)}`)
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
  console.error('Error', err)
  process.exit(1)
})
