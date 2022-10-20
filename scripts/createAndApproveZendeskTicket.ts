import { makeApproveZendeskTicketRequest } from '../integration-tests/utils/zendesk/approveZendeskTicket'
import { createZendeskTicket } from '../integration-tests/utils/zendesk/createZendeskTicket'
import { validRequestData } from '../integration-tests/constants/requestData'

const createAndApproveTicket = async () => {
  checkEnvironmentVariablesSet([
    'FIXED_SUBJECT_LINE',
    'FIXED_RECIPIENT_EMAIL',
    'DATA_PATHS',
    'FIXED_DATA_REQUEST_DATE'
  ])

  console.log(`creating ticket with data ${JSON.stringify(validRequestData)}`)
  const ticketId = await createZendeskTicket(validRequestData)
  await makeApproveZendeskTicketRequest(ticketId)
  console.log(`approved ticket with id ${ticketId}`)
}

const checkEnvironmentVariablesSet = (environmentVariables: string[]) =>
  environmentVariables.forEach((v) => checkRequiredEnvironmentVariableSet(v))

const checkRequiredEnvironmentVariableSet = (environmentVariable: string) => {
  if (!process.env[environmentVariable]) {
    throw new Error(`Must set ${environmentVariable} when calling this utility`)
  }
}

createAndApproveTicket().catch((err) => {
  console.error('Error', err)
  process.exit(1)
})
