import {
  DescribeStacksCommand,
  CloudFormationClient,
  Output
} from '@aws-sdk/client-cloudformation'

export const retrieveStackOutputs = async (stack: string, region: string) => {
  const client = new CloudFormationClient({ region: region })
  const command = new DescribeStacksCommand({ StackName: stack })
  const response = await client.send(command)

  if (!response.Stacks) {
    throw new Error(`Stack with name ${stack} not found.`)
  }

  const outputs = response?.Stacks[0].Outputs

  if (!outputs) {
    throw new Error('Stack has no outputs')
  }

  return outputs
}

export const getOutputValue = (outputs: Output[], name: string) => {
  const outputValue = outputs.find(
    (output) => output.OutputKey === name
  )?.OutputValue
  if (typeof outputValue === 'string') {
    return outputValue
  } else {
    throw new Error(`Output ${name} has no value`)
  }
}
