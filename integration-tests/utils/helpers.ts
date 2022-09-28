import { getZendeskAPIToken } from './validateTestParameters'
import { cloudWatchLogsClient } from '../libs/cloudWatchLogsClient'
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

const getLatestLogStreamName = async () => {
  interface LogStreamDetails {
    logStreamName: string
  }

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

  if (latestLogStreams && latestLogStreams.length > 0) {
    // const streamName = latestLogStreams[0].logStreamName
    //   ? latestLogStreams[0].logStreamName
    //   : ''
    const streamName = latestLogStreams[0].logStreamName as string
    const result: LogStreamDetails = {
      logStreamName: streamName
    }
    return result
  } else {
    throw new Error('No log stream found')
  }
}

const getMatchingLogEvents = async (
  filterPattern: string,
  streamName: string
): Promise<FilteredLogEvent[]> => {
  console.log(`CALLED, ${filterPattern}, ${streamName}`)
  const filterLogEventsParams: FilterLogEventsCommandInput = {
    logGroupName:
      '/aws/lambda/ticf-integration-InitiateDataRequestFunction-FgC9L2iTU6pG',
    logStreamNames: [streamName],
    filterPattern: `${filterPattern}`
  }

  const filterLogEventsCommand = new FilterLogEventsCommand(
    filterLogEventsParams
  )

  // await cloudWatchLogsClient
  //   .send(filterLogEventsCommand)
  //   .then((result) => {
  //     if (result.events) {
  //       return result.events
  //     } else {
  //       throw new Error('No events matched')
  //     }
  //   })
  //   .catch((error) => {
  //     throw new Error(error)
  //   })

  const filterLogEventsResponse: FilterLogEventsCommandOutput =
    await cloudWatchLogsClient.send(filterLogEventsCommand)

  console.log(`COMMAND SENT`)

  const filterLogEvents: FilteredLogEvent[] | undefined =
    filterLogEventsResponse.events

  console.log(`LOG EVENTS ARRAY SIZE: ${filterLogEvents?.length}`)

  if (filterLogEvents && filterLogEvents.length > 0) {
    filterLogEvents?.map((e) => {
      console.log(e.message)
    })
    return filterLogEvents
  } else {
    return []
  }
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
