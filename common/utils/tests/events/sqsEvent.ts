export const constructSqsEvent = (requestBody: string) => ({
  Records: [
    {
      messageId: '22b73f72-470b-4594-af38-72440d5f1e7d',
      receiptHandle: 'somereceiptHandle',
      body: requestBody,
      attributes: {
        ApproximateReceiveCount: '1',
        AWSTraceHeader: 'someTraceHeader',
        SentTimestamp: '1663168135665',
        SenderId: 'ABC123:some-stack-name',
        ApproximateFirstReceiveTimestamp: '1663168135670'
      },
      messageAttributes: {},
      md5OfBody: '80g5f39cja260622d3313a3040420a58',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:eu-west-2:1234567890123:some-stack-name',
      awsRegion: 'eu-west-2'
    }
  ]
})
