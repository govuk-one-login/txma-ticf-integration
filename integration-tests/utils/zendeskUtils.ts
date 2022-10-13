import axios from 'axios'
import { getEnvVariable } from '../lib/zendeskParameters'
import { authoriseAs } from './helpers'

const getTicketDetails = async (ticketID: string) => {
  const response = await axios({
    url: `${getEnvVariable(
      'ZENDESK_BASE_URL'
    )}/api/v2/tickets/${ticketID}.json`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${authoriseAs(
        getEnvVariable('ZENDESK_AGENT_EMAIL')
      )}`
    }
  })

  expect(response.status).toEqual(200)
  console.log(response.data)
  // console.log(
  //   `Ticket details successfully returned for ${ticketID}: ${response.data}`
  // )
}

export { getTicketDetails }
