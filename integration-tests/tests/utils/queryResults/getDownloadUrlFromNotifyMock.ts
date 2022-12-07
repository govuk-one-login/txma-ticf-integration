import axios from 'axios'
import { ZENDESK_BASE_URL } from '../../constants/zendeskParameters'
import { pause } from '../helpers'

export const pollNotifyMockForDownloadUrl = async (zendeskId: string) => {
  const maxAttempts = 30
  let attempts = 0
  let url = undefined
  while (!url && attempts < maxAttempts) {
    attempts++
    url = await getDownloadUrlFromNotifyMock(zendeskId)
    await pause(3000)
  }
  return url ?? ''
}

const getDownloadUrlFromNotifyMock = async (zendeskId: string) => {
  const response = await axios({
    url: `${ZENDESK_BASE_URL}/notifyrequest/${zendeskId}`,
    method: 'GET',
    headers: { Accept: 'application/json' },

    // Regardless of HTTP status code, we can just assert below without
    // having to try/catch.
    validateStatus: () => true
  })
  console.log(response)
  return response?.data?.secureDownloadUrl
}
