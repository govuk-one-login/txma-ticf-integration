export const checkSecretsSet = (
  secretName: string,
  secrets: { [key: string]: string },
  secretKeys: string[]
) => {
  secretKeys.forEach((k) => checkSecretSet(secretName, secrets, k))
}

const checkSecretSet = (
  secretName: string,
  secrets: { [key: string]: string },
  secretKey: string
) => {
  if (!secrets[secretKey]) {
    throw new Error(`Secret with key ${secretKey} not set in ${secretName}`)
  }
}
