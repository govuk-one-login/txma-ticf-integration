import axios, { AxiosResponse } from 'axios'
import { getEnvVariable } from '../lib/zendeskParameters'

import { authoriseAs } from './helpers'

import { validRequestData, invalidRequestData } from '../lib/requestData'

const createRequestEndpoint = '/api/v2/requests.json'
const zendeskBaseURL: string = getEnvVariable('ZENDESK_BASE_URL')
const endUsername: string = getEnvVariable('ZENDESK_END_USERNAME')

const createZendeskRequest = async (valid = true): Promise<string> => {
  const requestData = valid ? validRequestData : invalidRequestData
  const axiosResponse: AxiosResponse<any, any> = await axios({
    url: `${zendeskBaseURL}${createRequestEndpoint}`,
    method: 'POST',
    headers: {
      Authorization: `Basic ${authoriseAs(endUsername)}`,
      'Content-Type': 'application/json'
    },
    data: requestData
  })

  expect(axiosResponse.status).toBe(201)
  expect(axiosResponse.data.request.id).toBeDefined()

  const ticketID: string = axiosResponse.data.request.id

  console.log(`TICKET ID: ${ticketID}`)

  return ticketID
}

export { createZendeskRequest }
