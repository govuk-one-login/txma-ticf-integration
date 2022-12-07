import axios from 'axios'
import { authoriseAs } from './authoriseAs'
import { ZENDESK_TICKETS_ENDPOINT } from '../../constants/zendeskParameters'
import { getEnv } from '../helpers'

export const getZendeskTicket = async (ticketId: string) => {
  try {
    const response = await axios({
      url: `https://${getEnv(
        'ZENDESK_HOSTNAME'
      )}${ZENDESK_TICKETS_ENDPOINT}/${ticketId}`,
      method: 'GET',
      headers: {
        Authorization: authoriseAs(getEnv('ZENDESK_AGENT_EMAIL')),
        Accept: 'application/json'
      }
    })

    return response.data.ticket
  } catch (error) {
    console.log(error)
    throw 'Error getting Zendesk ticket details'
  }
}
