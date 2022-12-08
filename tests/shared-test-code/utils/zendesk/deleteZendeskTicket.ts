import axios from 'axios'
import { authoriseAs } from './authoriseAs'
import { ZENDESK_TICKETS_ENDPOINT } from '../../constants/zendeskParameters'
import { getEnv } from '../helpers'

export const deleteZendeskTicket = async (ticketId: string) => {
  try {
    await axios({
      url: `https://${getEnv(
        'ZENDESK_HOSTNAME'
      )}${ZENDESK_TICKETS_ENDPOINT}/${ticketId}`,
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
