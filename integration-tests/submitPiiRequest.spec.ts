import axios from 'axios'
import { authoriseAs } from './utils/helpers'
// import { AWS } from 'aws-sdk'
import AWS = require('aws-sdk')
// import { getLogStreams } from 'aws-testing-library'

import {
  getEndUsername,
  getAgentUsername,
  getZendeskBaseURL
} from './utils/validateTestParameters'

import { validRequestData, ticketApprovalData } from './utils/requestData'
import { AWSError } from 'aws-sdk'

describe('Submit a PII request with approved ticket data', () => {
  const createRequestEndpoint = '/api/v2/requests.json'
  const ticketsEndpoint = '/api/v2/tickets'
  const zendeskBaseURL: string = getZendeskBaseURL()
  const endUsername: string = getEndUsername()
  const agentUsername: string = getAgentUsername()

  it('Should log an entry in cloud watch if request is valid', async () => {
    const response = await axios({
      url: `${zendeskBaseURL}${createRequestEndpoint}`,
      method: 'POST',
      headers: {
        Authorization: `Basic ${authoriseAs(endUsername)}`,
        'Content-Type': 'application/json'
      },
      data: validRequestData
    })

    console.log(response.request)

    expect(response.status).toBe(201)
    expect(response.data.request.id).toBeGreaterThanOrEqual(1)

    const ticketID = response.data.request.id

    console.log(`TICKET ID: ${ticketID}`)

    // approve and submit ticket (fires webhook)
    const approvalResponse = await axios({
      url: `${zendeskBaseURL}${ticketsEndpoint}/${ticketID}`,
      method: 'PUT',
      headers: {
        Authorization: `Basic ${authoriseAs(agentUsername)}`,
        'Content-Type': 'application/json'
      },
      data: ticketApprovalData
    })

    expect(approvalResponse.status).toEqual(200)
    expect(approvalResponse.data.ticket.status).toBe('open')
    expect(approvalResponse.data.ticket.tags).toEqual(
      expect.arrayContaining(['approved'])
    )

    // check logs in Cloudwatch - Cloudwatch API
    AWS.config.update({ region: 'eu-west-2' })
    const cloudwatchLogs = new AWS.CloudWatchLogs({ apiVersion: '2014-03-28' })
    const logGroupName =
      '/aws/lambda/ticf-integration-InitiateDataRequestFunction-FgC9L2iTU6pG'
    console.log(cloudwatchLogs)
    const logStreamParams = {
      logGroupName: `${logGroupName}`,
      descending: true,
      logStreamNamePrefix:
        '2022/09/20/[$LATEST]1ebb7288e141430f95bc38b9ab95f28c',
      orderBy: 'LastEventTime'
    }
    const logStreamResult = cloudwatchLogs.describeLogStreams(
      logStreamParams,
      (error: AWSError, data: any) => {
        if (error) {
          throw new Error(error.message)
        } else {
          return data
        }
      }
    )
    expect(logStreamResult).toBeDefined()
    console.log(logStreamResult)

    // describe subscription filters for the lambda log group
    // let existingSubscriptionFilterParams = {
    //   logGroupName: '/aws/lambda/ticf-integration-InitiateDataRequestFunction-FgC9L2iTU6pG',
    //   limit: 11
    // }

    // cloudwatchLogs.describeSubscriptionFilters(existingSubscriptionFilterParams, (error, data) => {
    //   if(error) {
    //     throw new Error(`Error describing subscription filters. ${error}`)
    //   } else {
    //     console.log('Success', data.subscriptionFilters)
    //   }
    // })

    // // create a subscription filter for the lambda log group
    // var newSubscriptionFilterParams = {
    //   destinationArn: 'arn:aws:lambda:eu-west-2:428504475239:function:ticf-integration-InitiateDataRequestFunction-FgC9L2iTU6pG',
    //   filterName: 'Integration-test-cloudwatch-log-subscription-filter',
    //   filterPattern: 'ERROR',
    //   logGroupName: '/aws/lambda/ticf-integration-InitiateDataRequestFunction-FgC9L2iTU6pG',
    // };

    // cloudwatchLogs.putSubscriptionFilter(newSubscriptionFilterParams, (error, data) => {
    //   if(error){
    //     throw new Error(`Error creating new subscription filter. ${error}`)
    //   } else {
    //     console.log('Success', data)
    //   }
    // })

    // check logs in Cloudwatch - AWS testing library
    // const functionName =
    //   'ticf-integration-InitiateDataRequestFunction-FgC9L2iTU6pG'
    // const region = 'eu-west-2'
    // const logStream = getLogStreams(region, functionName)
    // console.log(logStream)
    // expect(logStream).toBeDefined()
  })
})
