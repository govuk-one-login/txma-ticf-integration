import axios from 'axios'
import { authoriseAs } from './authoriseAs'
import { ZendeskComment } from '../../types/zendeskComment'
import { getEnv } from '../helpers'

export const listZendeskTicketComments = async (
  ticketId: string
): Promise<ZendeskComment[]> => {
  try {
    const response = await axios({
      url: `https://${getEnv(
        'ZENDESK_HOSTNAME'
      )}/api/v2/tickets/${ticketId}/comments`,
      method: 'GET',
      headers: {
        Authorization: authoriseAs(getEnv('ZENDESK_AGENT_EMAIL')),
        Accept: 'application/json'
      }
    })

    return response.data.comments
  } catch (error) {
    console.log(error)
    throw 'Error getting Zendesk ticket comments'
  }
}
