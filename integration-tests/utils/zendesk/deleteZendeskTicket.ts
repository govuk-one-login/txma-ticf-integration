import axios from 'axios'
import { authoriseAs } from './authoriseAs'
import {
  ZENDESK_ADMIN_EMAIL,
  ZENDESK_BASE_URL,
  ZENDESK_TICKETS_ENDPOINT
} from '../../constants/zendeskParameters'

export const deleteZendeskTicket = async (ticketId: string) => {
  try {
    await axios({
      url: `${ZENDESK_BASE_URL}${ZENDESK_TICKETS_ENDPOINT}/${ticketId}`,
      method: 'DELETE',
      headers: {
        Authorization: authoriseAs(ZENDESK_ADMIN_EMAIL)
      }
    })
  } catch (error) {
    console.log(error)
    throw 'Deleting Zendesk ticket failed'
  }
}
