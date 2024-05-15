import { generateInitiateCopyAndDecryptPayload } from './generateInitiateCopyAndDecryptPayload'

describe('generateInitiateCopyAndDecryptPayload', () => {
  it('should generate a payload with the correct structure', () => {
    const payload = generateInitiateCopyAndDecryptPayload(
      ['2020-01-01'],
      '123456789'
    )

    expect(payload).toEqual({
      zendeskId: 'MR123456789',
      dates: ['2020-01-01'],
      requesterEmail: 'manualquery@example.com',
      requesterName: 'txma',
      recipientEmail: 'manualquery@example.com',
      recipientName: '',
      identifierType: 'event_id',
      sessionIds: [],
      journeyIds: [],
      eventIds: [],
      userIds: [],
      piiTypes: [],
      dataPaths: []
    })
  })
})
