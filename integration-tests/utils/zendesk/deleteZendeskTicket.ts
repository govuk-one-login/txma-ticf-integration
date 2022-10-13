import axios from 'axios'
import {
  ZENDESK_ADMIN_EMAIL,
  ZENDESK_BASE_URL,
  ZENDESK_TICKETS_ENDPOINT
} from '../../constants/zendeskParameters'
import { authoriseAs } from '../helpers'

export const deleteZendeskTicket = async (ticketId: string) => {
  try {
    await axios({
      url: `${ZENDESK_BASE_URL}${ZENDESK_TICKETS_ENDPOINT}/${ticketId}`,
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${authoriseAs(ZENDESK_ADMIN_EMAIL)}`
      }
    })
  } catch (error) {
    console.log(error)
    throw 'Deleting Zendesk ticket failed'
  }
}
