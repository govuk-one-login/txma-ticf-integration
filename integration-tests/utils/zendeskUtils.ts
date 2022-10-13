import axios from 'axios'
import { getEnvVariable } from '../lib/zendeskParameters'

const generateRandomNumber = () => {
  return Math.floor(Math.random() * 100).toString()
}

const authoriseAs = (username: string) => {
  return Buffer.from(
    `${username}/token:${getEnvVariable('ZENDESK_API_KEY')}`
  ).toString('base64')
}

const generateZendeskRequestDate = (offset: number): string => {
  const fixedRequestDate = process.env.FIXED_DATA_REQUEST_DATE
  if (fixedRequestDate) {
    return fixedRequestDate
  }

  const today: Date = new Date()
  today.setDate(today.getDate() + offset)

  const dateFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat('en-GB')
  const dateParts: string[] = dateFormat.format(today).split('/')
  return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
}

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
  return response.data.ticket
}

export {
  getTicketDetails,
  generateRandomNumber,
  generateZendeskRequestDate,
  authoriseAs
}
