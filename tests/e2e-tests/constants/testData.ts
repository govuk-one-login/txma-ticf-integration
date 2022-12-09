export const testData: TestDataConstants = {
  dataPath:
    'restricted.name[0].nameParts[0].value restricted.name[0].nameParts[1].value restricted.birthDate[0].value restricted.address[0].validFrom restricted.address[1].postalCode',
  date: '2022-04-01',
  eventId: 'b122aa00-129b-46a9-b5f7-6b1bf07d427b',
  fileName: 'endToEndTestData.txt.gz',
  journeyId: '71b8300f-8f06-40e7-a53e-a194beacd33f',
  prefix: '2022/04/01',
  sessionId: '25bc52a5-3506-4d7a-8129-adc13a3152bf',
  userId: 'urn:uuid:03d3c6d3-6d7c-41df-bf45-c94401c96a2e'
}

type TestDataConstants = {
  readonly dataPath: string
  readonly date: string
  readonly eventId: string
  readonly fileName: string
  readonly journeyId: string
  readonly prefix: string
  readonly sessionId: string
  readonly userId: string
}
