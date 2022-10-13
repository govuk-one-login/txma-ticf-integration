import axios from 'axios'
import { authoriseAs } from './authoriseAs'
import { ticketApprovalData } from '../../constants/requestData'
import {
  ZENDESK_AGENT_EMAIL,
  ZENDESK_BASE_URL,
  ZENDESK_TICKETS_ENDPOINT
} from '../../constants/zendeskParameters'

export const approveZendeskTicket = async (ticketId: string) => {
  try {
    await axios({
      url: `${ZENDESK_BASE_URL}${ZENDESK_TICKETS_ENDPOINT}/${ticketId}`,
      method: 'PUT',
      headers: {
        Authorization: `Basic ${authoriseAs(ZENDESK_AGENT_EMAIL)}`,
        'Content-Type': 'application/json'
      },
      data: ticketApprovalData
    })
  } catch (error) {
    console.log(error)
    throw 'Error approving Zendesk ticket'
  }
}
