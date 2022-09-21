import { EnvironmentVar } from '../types/environmentVar'

export const getEnv = (name: EnvironmentVar['name']) => {
  const env = process.env[name]

  if (env === undefined || env === null)
    throw Error(`Missing environment variable: ${name}`)

  return env
}

export const getEpochDate = (dateString: string) => {
  const dateParts = dateString.split('-')

  const epochDate = Date.UTC(
    parseInt(dateParts[0]),
    parseInt(dateParts[1]) - 1,
    parseInt(dateParts[2])
  )

  if (isNaN(epochDate))
    throw Error(`String '${dateString}' is not a valid date`)

  return epochDate
}

export const tryParseJSON = (jsonString: string) => {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Error parsing JSON: ', error)
    return {}
  }
}

export const isEmpty = (obj: object): boolean => {
  return obj && Object.keys(obj).length === 0
}
