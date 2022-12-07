import axios from 'axios'
import { authoriseAs } from './authoriseAs'
import {
  ZENDESK_BASE_URL,
  ZENDESK_END_USER_EMAIL,
  ZENDESK_REQUESTS_ENDPOINT
} from '../../constants/zendeskParameters'
import { ZendeskRequestData } from '../../../integration-tests/types/zendeskRequestData'

export const createZendeskTicket = async (requestData: ZendeskRequestData) => {
  try {
    const response = await axios({
      url: `${ZENDESK_BASE_URL}${ZENDESK_REQUESTS_ENDPOINT}`,
      method: 'POST',
      headers: {
        Authorization: authoriseAs(ZENDESK_END_USER_EMAIL),
        'Content-Type': 'application/json'
      },
      data: requestData
    })
    const ticketId = response.data.request.id.toString()
    console.log(`Created ticket with id: ${ticketId}`)

    return ticketId
  } catch (error) {
    console.log(error)
    throw 'Creating Zendesk ticket failed'
  }
}
