import { EnvironmentVar } from '../../integration-tests/types/environmentVar'

export const generateRandomNumber = () => {
  return Math.floor(Math.random() * 100).toString()
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

export const pause = (delay: number): Promise<unknown> => {
  return new Promise((r) => setTimeout(r, delay))
}

export const appendRandomIdToFilename = (fileName: string) => {
  return (
    fileName.replace('.gz', '') + Math.round(Math.random() * 100000) + '.gz'
  )
}

export const currentDateEpochSeconds = (): number => {
  return Math.round(Date.now() / 1000)
}
