import { getEnv } from '../helpers'

export const authoriseAs = (username: string) => {
  return (
    'Basic ' +
    Buffer.from(`${username}/token:${getEnv('ZENDESK_API_KEY')}`).toString(
      'base64'
    )
  )
}
