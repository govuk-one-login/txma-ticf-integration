import { makeApproveZendeskTicketRequest } from './approveZendeskTicket'
import { createZendeskTicket } from './createZendeskTicket'
import { validRequestData } from '../../constants/requestData/dataCopyRequestData'

const createAndApproveTicket = async () => {
  if (!process.env.FIXED_DATA_REQUEST_DATE) {
    throw new Error(
      'Must set FIXED_DATA_REQUEST_DATE when calling this utility'
    )
  }
  if (!process.env.FIXED_SUBJECT_LINE) {
    throw new Error('Must set FIXED_SUBJECT_LINE when calling this utility')
  }
  console.log(`creating ticket with data ${JSON.stringify(validRequestData)}`)
  const ticketId = await createZendeskTicket(validRequestData)
  await makeApproveZendeskTicketRequest(ticketId)
  console.log(`approved ticket with id ${ticketId}`)
}

createAndApproveTicket().catch((err) => {
  console.error('Error', err)
  process.exit(1)
})
