import { cloudWatchLogsClient } from './cloudWatchLogsClient'
import {
  DescribeLogStreamsCommand,
  LogStream,
  FilterLogEventsCommand,
  FilteredLogEvent,
  FilterLogEventsCommandInput
} from '@aws-sdk/client-cloudwatch-logs'
import { pause } from '../helpers'

export const getCloudWatchLogEventsGroupByMessagePattern = async (
  logGroupName: string,
  eventMessagePatterns: string[],
  maxAttempts = 25
) => {
  const event = await waitForEventWithPatterns(
    logGroupName,
    eventMessagePatterns,
    maxAttempts
  )

  if (!event || !event.message) {
    console.log(
      `After ${maxAttempts} attempts, could not find event matching pattern ${eventMessagePatterns}`
    )
    return []
  }

  const requestId = extractRequestIdFromEventMessage(event.message)
  const eventLogStream = [{ logStreamName: event.logStreamName }]
  const requestEndFilterPattern = [`END RequestId: ${requestId}`]

  // Wait for final request in group
  await waitForEventWithPatterns(
    logGroupName,
    requestEndFilterPattern,
    maxAttempts
  )

  const logEvents = await findMatchingLogEvents(logGroupName, eventLogStream, [
    requestId
  ])
  console.log(
    `Found ${logEvents.length} events for request id ${requestId} in log stream ${eventLogStream[0].logStreamName}`
  )
  return logEvents
}

const getLogStreams = async (logGroupName: string) => {
  const input = {
    logGroupName: logGroupName,
    orderBy: 'LastEventTime',
    descending: true,
    limit: 15
  }
  const command = new DescribeLogStreamsCommand(input)
  const response = await cloudWatchLogsClient.send(command)
  const logStreams = response?.logStreams ?? []

  return logStreams
}

const findMatchingLogEvents = async (
  logGroupName: string,
  logStreams: LogStream[],
  filterPatterns: string[]
) => {
  return filterLogEvents({
    logGroupName: logGroupName,
    logStreamNames: logStreams.map(
      (logStream) => logStream?.logStreamName
    ) as string[],
    filterPattern: filterPatterns.map((pattern) => `"${pattern}"`).join(' ')
  })
}

const filterLogEvents = async (
  input: FilterLogEventsCommandInput,
  events: FilteredLogEvent[] = []
) => {
  const command = new FilterLogEventsCommand(input)
  const response = await cloudWatchLogsClient.send(command)

  if (!response.events) return []

  response.events.forEach((event) => events.push(event))

  if (response.nextToken) {
    input.nextToken = response.nextToken
    await filterLogEvents(input, events)
  }

  return events
}

const extractRequestIdFromEventMessage = (message: string) => {
  const requestId = message.split('\t')[1]
  console.log(`RequestId: ${requestId}`)

  return requestId
}

const waitForEventWithPatterns = async (
  logGroupName: string,
  eventMessagePatterns: string[],
  maxAttempts: number
) => {
  let attempts = 0

  while (attempts < maxAttempts) {
    attempts++
    const logStreams = await getLogStreams(logGroupName)

    const logEvents = await findMatchingLogEvents(
      logGroupName,
      logStreams,
      eventMessagePatterns
    )

    if (logEvents.length == 0) {
      await pause(5000)
      continue
    }

    if (logEvents.length > 1) {
      throw Error('More than 1 event matched, check filter patterns')
    }

    console.log(`Found event with patterns: ${eventMessagePatterns}`)
    return logEvents[0]
  }
}

export const assertEventPresent = (
  logEvents: FilteredLogEvent[],
  message: string
) => {
  const eventPresent = logEvents.some((event) =>
    event.message?.includes(message)
  )
  console.log('message', message)
  expect(eventPresent).toEqual(true)
}

export const assertEventNotPresent = (
  logEvents: FilteredLogEvent[],
  message: string
) => {
  const eventPresent = logEvents.some((event) =>
    event.message?.includes(message)
  )
  expect(eventPresent).toEqual(false)
}

export const getQueueMessageId = (
  logEvents: FilteredLogEvent[],
  message: string
) => {
  const event = logEvents.find((event) => event.message?.includes(message))

  if (!event || !event.message) throw Error('Message not added to queue')

  return event.message?.split('id')[1].trim()
}
