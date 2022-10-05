const message = ' is not set. Please check your test environment file.'

const getEnvVariable = (variableName: string) => {
  if (process.env[variableName]) {
    return process.env[variableName] as string
  } else {
    throw Error(`process.env.${variableName} ${message}`)
  }
}

export { getEnvVariable }
