import { getZendeskAPIToken } from './validateTestParameters'

const generateRandomNumber = () => {
  return Math.floor(Math.random() * 100).toString()
}

const authoriseAs = (username: string) => {
  return Buffer.from(`${username}/token:${getZendeskAPIToken()}`).toString(
    'base64'
  )
}

const getLogStreamPrefix = () => {
  const dateFormat = new Intl.DateTimeFormat('en-GB')
  const dateParts = dateFormat.format(new Date()).split('/')
  return `${
    dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0] + '[$LATEST]'
  }`
}
export { generateRandomNumber, authoriseAs, getLogStreamPrefix }
