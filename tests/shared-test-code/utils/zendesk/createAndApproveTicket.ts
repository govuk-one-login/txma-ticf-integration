import { requestConstants } from '../../../integration-tests/constants/requests'
import { makeApproveZendeskTicketRequest } from './approveZendeskTicket'
import { createZendeskTicket } from './createZendeskTicket'

const createAndApproveTicket = async () => {
  if (!process.env.FIXED_DATA_REQUEST_DATE) {
    throw new Error(
      'Must set FIXED_DATA_REQUEST_DATE when calling this utility'
    )
  }
  if (!process.env.FIXED_SUBJECT_LINE) {
    throw new Error('Must set FIXED_SUBJECT_LINE when calling this utility')
  }
  console.log(
    `creating ticket with data ${JSON.stringify(requestConstants.valid)}`
  )
  const ticketId = await createZendeskTicket(requestConstants.valid)
  await makeApproveZendeskTicketRequest(ticketId)
  console.log(`approved ticket with id ${ticketId}`)
}

createAndApproveTicket().catch((err) => {
  console.error('Error', err)
  process.exit(1)
})
