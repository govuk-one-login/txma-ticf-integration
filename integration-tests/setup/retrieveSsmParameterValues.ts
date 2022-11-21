import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'

export const retrieveSsmParameterValue = async (
  name: string,
  region: string
) => {
  const client = new SSMClient({
    region: region
  })
  const command = new GetParameterCommand({ Name: name })
  const value = (await client.send(command)).Parameter?.Value

  if (!value) {
    throw new Error(`SSM parameter with name ${name} not found.`)
  }

  return value
}
