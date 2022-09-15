export const constructInitiateDataRequestEvent = (requestBody: string) => ({
  Records: [
    {
      messageId: '22b73f72-470b-4594-af38-72440d5f1e7d',
      receiptHandle:
        'AQEBp/JoGmALps+s0zls1H+p85ShQf9QicU8SxGbL9vSVD+J2iLl0pekrY0L8Vzv5yoZuPzOJZFwUZm1JpTCHY2NqBuxoY6HDHZtbF3eL6l3qGEfRePp412zt6uZ3BLpDZPotEe6YepulASX93ifnesbxyjT99fuXAq2wgx25wOqsl2Szjk/s/uRLzHG9F79RDWFfpfxRuEv50kQ769wsBTAYW/z/Y77ItAkbLFiLXEfC34gZADiIXVT+RwesWPlh0n6CuCZhSjobaNE4Q9VVnqDpC7tEutg6CVBH2veuJpxEuE8FPmMSCbsPXPhtAWMqhZV/TNf2JUKGHpVctmfFx8Aq+syE7UGRnutAAhqZlSF68cHrskmpBD40vevfETYgkqe9301vKjLbMW4t3bSs5u3UszpKaTBKIcv93ShNhQ+4aMoxYiIgQYU97MkrBlwDCnAWiLfaaLKSXbP+NqB/DVmig==',
      body: requestBody,
      attributes: {
        ApproximateReceiveCount: '1',
        AWSTraceHeader:
          'Root=1-6321ee87-08cb963a5c7cd34c23a0d711;Parent=738271b31a210d41;Sampled=0',
        SentTimestamp: '1663168135665',
        SenderId:
          'AROAWHRG3MZTWIX3SW3BQ:tt61-sqs-between-validati-InitiateDataRequestFunct-jYG1YRNmEet2',
        ApproximateFirstReceiveTimestamp: '1663168135670'
      },
      messageAttributes: {},
      md5OfBody: '80f5f39c0a260622d3313a3040420a58',
      eventSource: 'aws:sqs',
      eventSourceARN:
        'arn:aws:sqs:eu-west-2:428504475239:tt61-sqs-between-validation-and--InitiateDataRequestQueue-C7dEDDYuULrB',
      awsRegion: 'eu-west-2'
    }
  ]
})
