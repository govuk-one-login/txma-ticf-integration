import { getZendeskAPIToken } from '../lib/zendeskParameters'
import { initiateDataRequestLambdalogGroupName } from '../lib/cloudWatchParameters'
import { cloudWatchLogsClient } from './cloudWatchLogsClient'
import {
  DescribeLogStreamsCommandInput,
  DescribeLogStreamsCommandOutput,
  DescribeLogStreamsCommand,
  LogStream,
  FilterLogEventsCommandInput,
  FilterLogEventsCommand,
  FilterLogEventsCommandOutput,
  FilteredLogEvent
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

const getLatestLogStreamName = async (): Promise<string> => {
  const describeLogStreamsParams: DescribeLogStreamsCommandInput = {
    logGroupName: initiateDataRequestLambdalogGroupName,
    orderBy: 'LastEventTime',
    descending: true,
    limit: 1
  }

  const describeLogStreamsCommand = new DescribeLogStreamsCommand(
    describeLogStreamsParams
  )

  const describeLogStreamsResponse: DescribeLogStreamsCommandOutput =
    await cloudWatchLogsClient.send(describeLogStreamsCommand)

  const latestLogStreams: LogStream[] =
    describeLogStreamsResponse.logStreams ?? []

  expect(latestLogStreams.length).toEqual(1)
  return latestLogStreams[0].logStreamName as string
}

const getMatchingLogEvents = async (
  filterPattern: string,
  streamName: string
): Promise<FilteredLogEvent[]> => {
  const filterLogEventsParams: FilterLogEventsCommandInput = {
    logGroupName: initiateDataRequestLambdalogGroupName,
    logStreamNames: [streamName],
    filterPattern: `${filterPattern}`
  }

  const filterLogEventsCommand = new FilterLogEventsCommand(
    filterLogEventsParams
  )
  const filterLogEventsResponse: FilterLogEventsCommandOutput =
    await cloudWatchLogsClient.send(filterLogEventsCommand)

  const filterLogEvents: FilteredLogEvent[] =
    filterLogEventsResponse.events ?? []

  return filterLogEvents
}

const extractRequestID = (message: string) => {
  let requestId = ''
  const firstLine = message.slice(0, message.indexOf('{'))
  console.log(`FIRST LINE: ${firstLine}`)

  requestId = firstLine.split(/\s+/)[1]
  console.log(`REQUEST ID: ${requestId}`)
  return requestId
}

export {
  generateRandomNumber,
  authoriseAs,
  getLogStreamPrefix,
  getLatestLogStreamName,
  getMatchingLogEvents,
  extractRequestID
}
