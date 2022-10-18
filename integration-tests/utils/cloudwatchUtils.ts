import { cloudWatchLogsClient } from './awsClients'
import { pause } from './pause'
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

const getLogStreamPrefix = () => {
  const dateFormat = new Intl.DateTimeFormat('en-GB')
  const dateParts = dateFormat.format(new Date()).split('/')
  return `${
    dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0] + '/' + '[$LATEST]'
  }`
}

const getLatestLogStreamName = async (
  logGroupName: string
): Promise<string> => {
  const describeLogStreamsParams: DescribeLogStreamsCommandInput = {
    logGroupName: logGroupName,
    orderBy: 'LastEventTime',
    descending: true,
    limit: 1
  }

  const describeLogStreamsCommand = new DescribeLogStreamsCommand(
    describeLogStreamsParams
  )

  await pause(100)

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

const waitForLogStreamContainingEvent = async (
  logGroupName: string,
  eventFilterPattern: string,
  ...eventMessagePatterns: string[]
): Promise<EventLogStream> => {
  if (eventMessagePatterns.length == 0) {
    throw Error('No message patterns provided for event')
  }

  let latestLogStreamName = await getLatestLogStreamName(logGroupName)
  let eventMatched = false
  let eventMessage = ''

  while (!eventMatched) {
    const logEvents = await getMatchingLogEvents(
      `${eventFilterPattern}`,
      latestLogStreamName,
      logGroupName
    )
    if (logEvents.length == 0) {
      latestLogStreamName = await getLatestLogStreamName(logGroupName)
      continue
    }

    const matchingEvent = logEvents.filter((event) => {
      let containsAllPatterns = false
      for (const element of eventMessagePatterns) {
        if (!event.message?.includes(element)) {
          console.log(`Event does not contain ${element}. Checking next event`)
          containsAllPatterns = false
          break
        } else {
          console.log(`Event contains ${element}`)
          containsAllPatterns = true
        }
      }
      return containsAllPatterns
    })

    console.log(
      `${matchingEvent.length} events match zendesk id in ${latestLogStreamName}`
    )

    if (matchingEvent.length >= 1) {
      console.log(`Event found in log stream: ${latestLogStreamName}`)
      eventMessage = matchingEvent[0].message as string
      console.log(`MATCHED EVENT: ${eventMessage}`)
      eventMatched = true
      break
    } else {
      latestLogStreamName = await getLatestLogStreamName(logGroupName)
    }
  }

  const result: EventLogStream = {
    logStreamName: latestLogStreamName,
    eventMessage: eventMessage
  }

  return result
}

const getMatchingLogEvents = async (
  filterPattern: string,
  streamName: string,
  logGroupName: string
): Promise<FilteredLogEvent[]> => {
  const filterLogEventsParams: FilterLogEventsCommandInput = {
    logGroupName: logGroupName,
    logStreamNames: [streamName],
    filterPattern: `${filterPattern}`
  }

  const filterLogEventsCommand = new FilterLogEventsCommand(
    filterLogEventsParams
  )

  await pause(100)
  const filterLogEventsResponse: FilterLogEventsCommandOutput =
    await cloudWatchLogsClient.send(filterLogEventsCommand)

  const filterLogEvents: FilteredLogEvent[] =
    filterLogEventsResponse.events ?? []
  return filterLogEvents
}

const extractRequestIDFromEventMessage = (message: string) => {
  let requestId = ''
  const firstLine = message.slice(0, message.indexOf('{'))
  console.log(`FIRST LINE: ${firstLine}`)

  requestId = firstLine.split(/\s+/)[1]
  console.log(`REQUEST ID: ${requestId}`)
  return requestId
}

export {
  getLogStreamPrefix,
  getLatestLogStreamName,
  getMatchingLogEvents,
  extractRequestIDFromEventMessage,
  waitForLogStreamContainingEvent
}
