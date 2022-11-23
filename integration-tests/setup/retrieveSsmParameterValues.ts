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
    const response = await client.send(command)
    return response.Parameter?.Value as string
  } catch (error) {
    throw new Error(`SSM parameter with name ${name} not found. \n${error}`)
  }
}
