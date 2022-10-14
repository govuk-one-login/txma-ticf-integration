import axios from 'axios'
import { authoriseAs } from './authoriseAs'
import { ticketApprovalData } from '../../constants/requestData'
import {
  ZENDESK_AGENT_EMAIL,
  ZENDESK_BASE_URL,
  ZENDESK_TICKETS_ENDPOINT
} from '../../constants/zendeskParameters'

export const showZendeskTicket = async (ticketId: string) => {
  try {
    const response = await axios({
      url: `${ZENDESK_BASE_URL}${ZENDESK_TICKETS_ENDPOINT}/${ticketId}`,
      method: 'GET',
      headers: {
        Authorization: authoriseAs(ZENDESK_AGENT_EMAIL),
        Accept: 'application/json'
      },
      data: ticketApprovalData
    })

    return response.data
  } catch (error) {
    console.log(error)
    throw 'Error getting Zendesk ticket details'
  }
}
