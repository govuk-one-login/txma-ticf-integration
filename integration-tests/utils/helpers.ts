import { getZendeskAPIToken } from './validateTestParameters'
import { cloudWatchLogsClient } from '../libs/cloudWatchLogsClient'
import {
  DescribeLogStreamsCommandInput,
  DescribeLogStreamsCommandOutput,
  DescribeLogStreamsCommand,
  LogStream
} from '@aws-sdk/client-cloudwatch-logs'

const generateRandomNumber = () => {
  return Math.floor(Math.random() * 100).toString()
}

const authoriseAs = (username: string) => {
  return Buffer.from(`${username}/token:${getZendeskAPIToken()}`).toString(
    'base64'
  )
}

const getLogStreamPrefix = () => {
  const dateFormat = new Intl.DateTimeFormat('en-GB')
  const dateParts = dateFormat.format(new Date()).split('/')
  return `${
    dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0] + '/' + '[$LATEST]'
  }`
}

const getLatestLogStreamName = async () => {
  const describeLogStreamsParams: DescribeLogStreamsCommandInput = {
    logGroupName:
      '/aws/lambda/ticf-integration-InitiateDataRequestFunction-FgC9L2iTU6pG',
    orderBy: 'LastEventTime',
    descending: true,
    limit: 1
  }

  const describeLogStreamsCommand = new DescribeLogStreamsCommand(
    describeLogStreamsParams
  )
  const describeLogStreamsResponse: DescribeLogStreamsCommandOutput =
    await cloudWatchLogsClient.send(describeLogStreamsCommand)
  const latestLogStreams: LogStream[] | undefined =
    describeLogStreamsResponse.logStreams

  if (latestLogStreams) {
    return latestLogStreams[0].logStreamName
      ? latestLogStreams[0].logStreamName
      : ''
  } else {
    throw new Error('No log stream found')
  }
}

export {
  generateRandomNumber,
  authoriseAs,
  getLogStreamPrefix,
  getLatestLogStreamName
}
