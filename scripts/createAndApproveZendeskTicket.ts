import { makeApproveZendeskTicketRequest } from '../integration-tests/utils/zendesk/approveZendeskTicket'
import { createZendeskTicket } from '../integration-tests/utils/zendesk/createZendeskTicket'
import { ZendeskRequestData } from '../integration-tests/types/zendeskRequestData'
import {
  ZendeskFormFieldIDs,
  ZENDESK_END_USER_NAME,
  ZENDESK_PII_FORM_ID
} from '../integration-tests/constants/zendeskParameters'

const generateTicketData = (): ZendeskRequestData => ({
  request: {
    subject: process.env.FIXED_SUBJECT_LINE!,
    ticket_form_id: ZENDESK_PII_FORM_ID,
    custom_fields: [
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_FIELD_ID,
        value: 'event_id'
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_EVENT_ID_LIST_FIELD_ID,
        value: process.env.OVERRIDE_EVENT_IDS!
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUEST_DATE_FIELD_ID,
        value: process.env.FIXED_DATA_REQUEST_DATE!
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_REQUESTED_PII_TYPE_FIELD_ID,
        value: ['drivers_license']
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_CUSTOM_DATA_PATH_FIELD_ID,
        value: process.env.DATA_PATHS!
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_EMAIL,
        value: process.env.FIXED_RECIPIENT_EMAIL!
      },
      {
        id: ZendeskFormFieldIDs.PII_FORM_IDENTIFIER_RECIPIENT_NAME,
        value: ZENDESK_END_USER_NAME
      }
    ],
    comment: {
      body: 'PII request created in integration test'
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
