import axios from 'axios'
import { getEnvVariable } from '../lib/zendeskParameters'
import { authoriseAs } from './helpers'

const zendeskDeleteTicketEndpoint = '/api/v2/tickets'
const zendeskBaseURL = getEnvVariable('ZENDESK_BASE_URL')
const adminEmail = getEnvVariable('ZENDESK_ADMIN_EMAIL')

export const deleteZendeskTicket = async (ticketId: string) => {
  const axiosResponse = await axios({
    url: `${zendeskBaseURL}${zendeskDeleteTicketEndpoint}/${ticketId}`,
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${authoriseAs(adminEmail)}`
    }
  })
  expect(axiosResponse.status).toEqual(204)
}
