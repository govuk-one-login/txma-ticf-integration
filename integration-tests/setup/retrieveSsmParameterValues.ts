import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'

export const retrieveSsmParameterValue = async (
  name: string,
  region: string
) => {
  const client = new SSMClient({
    region: region
  })
  const command = new GetParameterCommand({ Name: name })

  try {
    return (await client.send(command)).Parameter?.Value as string
  } catch (error) {
    throw new Error(`SSM parameter with name ${name} not found. \n${error}`)
  }
}
