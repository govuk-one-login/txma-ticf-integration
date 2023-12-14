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
      requesterEmail: 'manualquery@test.gov.uk',
      requesterName: 'txma',
      recipientEmail: 'manualquery@test.gov.uk',
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
