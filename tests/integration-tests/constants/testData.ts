export const integrationTestData: IntegrationTestDataConstants = {
  athenaTestFileName: 'athena-query-test-data.gz',
  athenaTestPrefix: '2022/04/01',
  dataCopyTestFileName: 'test-audit-data.gz',
  date: '2022-01-01',
  eventId: 'c9e2bf44-b95e-4f9a-81c4-cf02d42c1552'
}

type IntegrationTestDataConstants = {
  readonly athenaTestFileName: string
  readonly athenaTestPrefix: string
  readonly date: string
  readonly dataCopyTestFileName: string
  readonly eventId: string
}
