import { EnvironmentVar } from '../types/environmentVar'

export const generateRandomNumber = () => {
  return Math.floor(Math.random() * 100).toString()
}

export const authoriseAs = (username: string) => {
  return Buffer.from(`${username}/token:${getEnv('ZENDESK_API_KEY')}`).toString(
    'base64'
  )
}

export const generateZendeskRequestDate = (offset: number): string => {
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

export const getEnv = (name: EnvironmentVar['name']) => {
  const env = process.env[name]

  if (env === undefined || env === null)
    throw Error(`Missing environment variable: ${name}`)

  return env
}
