import axios from 'axios'
import { authoriseAs } from '../helpers'
import {
  ZENDESK_BASE_URL,
  ZENDESK_END_USER_EMAIL,
  ZENDESK_REQUESTS_ENDPOINT
} from '../../constants/zendeskParameters'
import { ZendeskRequestData } from '../../types/zendeskRequestData'

export const createZendeskTicket = async (requestData: ZendeskRequestData) => {
  try {
    const response = await axios({
      url: `${ZENDESK_BASE_URL}${ZENDESK_REQUESTS_ENDPOINT}`,
      method: 'POST',
      headers: {
        Authorization: `Basic ${authoriseAs(ZENDESK_END_USER_EMAIL)}`,
        'Content-Type': 'application/json'
      },
      data: requestData
    })
    return response.data.request.id.toString()
  } catch (error) {
    console.log(error)
    throw 'Creating Zendesk ticket failed'
  }
}
