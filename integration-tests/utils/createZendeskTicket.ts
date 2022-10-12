import axios from 'axios'
import { getEnvVariable } from '../lib/zendeskParameters'

import { authoriseAs } from './helpers'

import { validRequestData, invalidRequestData } from '../lib/requestData'

const createRequestEndpoint = '/api/v2/requests.json'
const zendeskBaseURL = getEnvVariable('ZENDESK_BASE_URL')
const endUserEmail = getEnvVariable('ZENDESK_END_USER_EMAIL')

const createZendeskRequest = async (valid = true): Promise<string> => {
  const requestData = valid ? validRequestData : invalidRequestData

  const axiosResponse = await axios({
    url: `${zendeskBaseURL}${createRequestEndpoint}`,
    method: 'POST',
    headers: {
      Authorization: `Basic ${authoriseAs(endUserEmail)}`,
      'Content-Type': 'application/json'
    },
    data: requestData
  })
  console.log(JSON.stringify(axiosResponse.data))
  expect(axiosResponse.status).toBe(201)
  expect(axiosResponse.data.request.id).toBeDefined()

  const ticketID = axiosResponse.data.request.id

  console.log(`TICKET ID: ${ticketID}`)

  return ticketID.toString()
}

export { createZendeskRequest }
