import { INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP } from '../../constants/awsParameters'
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

export const getLogStreamPrefix = () => {
  const dateFormat = new Intl.DateTimeFormat('en-GB')
  const dateParts = dateFormat.format(new Date()).split('/')
  return `${
    dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0] + '/' + '[$LATEST]'
  }`
}

const getLatestLogStreamName = async (): Promise<string> => {
  const describeLogStreamsParams: DescribeLogStreamsCommandInput = {
    logGroupName: INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
    orderBy: 'LastEventTime',
    descending: true,
    limit: 1
  }

  const describeLogStreamsCommand = new DescribeLogStreamsCommand(
    describeLogStreamsParams
  )

  await pause(500)

  const describeLogStreamsResponse: DescribeLogStreamsCommandOutput =
    await cloudWatchLogsClient.send(describeLogStreamsCommand)

  const latestLogStreams: LogStream[] =
    describeLogStreamsResponse.logStreams ?? []

  expect(latestLogStreams.length).toEqual(1)
  return latestLogStreams[0].logStreamName as string
}

interface EventLogStream {
  logStreamName: string
  eventMessage: string
}

export const waitForLogStreamContainingEvent = async (
  eventFilterPattern: string,
  ...eventMessagePatterns: string[]
): Promise<EventLogStream> => {
  if (eventMessagePatterns.length == 0) {
    throw Error('No message patterns provided for event')
  }

  let latestLogStreamName = await getLatestLogStreamName()
  console.log(`LATEST LOG STREAM NAME: ${latestLogStreamName}`)
  let eventMatched = false
  let eventMessage = ''

  while (!eventMatched) {
    const logEvents = await getMatchingLogEvents(
      `${eventFilterPattern}`,
      latestLogStreamName
    )
    if (logEvents.length == 0) {
      latestLogStreamName = await getLatestLogStreamName()
      continue
    }
    const matchingEvent = logEvents.filter((event) => {
      let containsAllPatterns = false
      for (const element of eventMessagePatterns) {
        if (!event.message?.includes(element)) {
          containsAllPatterns = false
          break
        } else {
          containsAllPatterns = true
        }
      }
      return containsAllPatterns
    })
    if (matchingEvent.length == 1) {
      console.log(`Event found in log stream: ${latestLogStreamName}`)
      eventMessage = matchingEvent[0].message as string
      console.log(`MATCHED EVENT: ${eventMessage}`)
      eventMatched = true
      break
    } else {
      latestLogStreamName = await getLatestLogStreamName()
    }
  }
  const result: EventLogStream = {
    logStreamName: latestLogStreamName,
    eventMessage: eventMessage
  }

  return result
}

const pause = (delay: number): Promise<unknown> => {
  return new Promise((r) => setTimeout(r, delay))
}

export const getMatchingLogEvents = async (
  filterPattern: string,
  streamName: string
): Promise<FilteredLogEvent[]> => {
  const filterLogEventsParams: FilterLogEventsCommandInput = {
    logGroupName: INITIATE_DATA_REQUEST_LAMBDA_LOG_GROUP,
    logStreamNames: [streamName],
    filterPattern: `${filterPattern}`
  }

  const filterLogEventsCommand = new FilterLogEventsCommand(
    filterLogEventsParams
  )

  await pause(500)
  const filterLogEventsResponse: FilterLogEventsCommandOutput =
    await cloudWatchLogsClient.send(filterLogEventsCommand)

  const filterLogEvents: FilteredLogEvent[] =
    filterLogEventsResponse.events ?? []

  console.log(`FILTERED LOG EVENTS: ${filterLogEvents.length}`)

  return filterLogEvents
}

export const extractRequestIDFromEventMessage = (message: string) => {
  let requestId = ''
  const firstLine = message.slice(0, message.indexOf('{'))
  console.log(`FIRST LINE: ${firstLine}`)

  requestId = firstLine.split(/\s+/)[1]
  console.log(`REQUEST ID: ${requestId}`)
  return requestId
}