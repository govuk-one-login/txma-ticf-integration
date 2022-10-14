import { INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP } from '../../constants/awsParameters'
import { cloudWatchLogsClient } from './cloudWatchLogsClient'
import {
  DescribeLogStreamsCommand,
  LogStream,
  FilterLogEventsCommand,
  FilteredLogEvent
} from '@aws-sdk/client-cloudwatch-logs'

export const getCloudWatchLogEventsByMessagePattern = async (
  logGroupName: string,
  ...eventMessagePatterns: string[]
) => {
  let attempts = 0
  let logStreams = await getLogStreams(logGroupName)
  let eventMatched = false
  let logEvents: FilteredLogEvent[]

  while (!eventMatched && attempts < 20) {
    attempts++
    logEvents = await findMatchingLogEvents(logStreams, ...eventMessagePatterns)

    if (logEvents.length == 0) {
      await pause(1000)
      logStreams = await getLogStreams(logGroupName)
      continue
    }

    if (logEvents.length > 1) {
      throw 'More than 1 event matched, check filter patterns'
    }

    const message = logEvents[0]?.message as string
    console.log(`Found event: ${message}`)
    eventMatched = true

    const requestId = extractRequestIDFromEventMessage(message)
    return await findMatchingLogEvents(logStreams, requestId)
  }

  return []
}

const getLogStreams = async (logGroupName: string) => {
  const input = {
    logGroupName: logGroupName,
    orderBy: 'LastEventTime',
    descending: true,
    limit: 5
  }
  const command = new DescribeLogStreamsCommand(input)
  const response = await cloudWatchLogsClient.send(command)
  const logStreams = response?.logStreams ?? []

  logStreams.length > 0
    ? console.log(`Searching in log stream: ${logStreams[0]?.logStreamName}`)
    : console.log('No log streams found')

  return logStreams
}

const findMatchingLogEvents = async (
  logStreams: LogStream[],
  ...filterPatterns: string[]
) => {
  const input = {
    logGroupName: INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
    logStreamNames: logStreams.map(
      (logStream) => logStream?.logStreamName
    ) as string[],
    filterPattern: filterPatterns.map((pattern) => `"${pattern}"`).join(' ')
  }
  const command = new FilterLogEventsCommand(input)
  const response = await cloudWatchLogsClient.send(command)
  return response.events ?? []
}

const extractRequestIDFromEventMessage = (message: string) => {
  let requestId = ''
  const firstLine = message.slice(0, message.indexOf('{'))
  requestId = firstLine.split(/\s+/)[1]
  console.log(`REQUEST ID: ${requestId}`)
  return requestId
}

const pause = (delay: number): Promise<unknown> => {
  return new Promise((r) => setTimeout(r, delay))
}
