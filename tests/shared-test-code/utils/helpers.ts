import { EnvironmentVar } from '../types/environmentVar'

export const generateRandomNumberString = (max = 100) => {
  return Math.floor(Math.random() * max).toString()
}

export const generateCurrentDateWithOffset = (offset: number): string => {
  const today = new Date()
  today.setDate(today.getDate() + offset)

  return today.toISOString().split('T')[0]
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

export const currentDateEpochSeconds = (): number => {
  return Math.round(Date.now() / 1000)
}
