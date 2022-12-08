import axios from 'axios'
import { authoriseAs } from './authoriseAs'
import { ZENDESK_REQUESTS_ENDPOINT } from '../../constants/zendeskParameters'
import { ZendeskRequestData } from '../../types/zendeskRequestData'
import { getEnv } from '../helpers'

export const createZendeskTicket = async (requestData: ZendeskRequestData) => {
  try {
    const response = await axios({
      url: `https://${getEnv('ZENDESK_HOSTNAME')}${ZENDESK_REQUESTS_ENDPOINT}`,
      method: 'POST',
      headers: {
        Authorization: authoriseAs(getEnv('ZENDESK_END_USER_EMAIL')),
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
