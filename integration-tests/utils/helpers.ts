import { getZendeskAPIToken } from './validateTestParameters'

const generateRandomNumber = () => {
  return Math.floor(Math.random() * 100).toString()
}

const authoriseAs = (username: string) => {
  return Buffer.from(`${username}/token:${getZendeskAPIToken()}`).toString(
    'base64'
  )
}

export { generateRandomNumber, authoriseAs }
