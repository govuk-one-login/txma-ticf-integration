import axios from 'axios'
import { authoriseAs } from './authoriseAs'
import { getEnv } from '../helpers'

export const deleteZendeskTicket = async (ticketId: string) => {
  try {
    await axios({
      url: `https://${getEnv('ZENDESK_HOSTNAME')}/api/v2/tickets/${ticketId}`,
      method: 'DELETE',
      headers: {
        Authorization: authoriseAs(getEnv('ZENDESK_ADMIN_EMAIL'))
      }
    })
  } catch (error) {
    console.log(error)
    throw 'Deleting Zendesk ticket failed'
  }
}
