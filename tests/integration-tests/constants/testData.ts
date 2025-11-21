export const testData: TestDataConstants = {
  athenaTestEventId1: '99cbfa88-5277-422f-af25-be0864adb7db',
  athenaTestEventId2: 'e9919603-77ab-4cd2-8f3a-b3fda80fa39c',
  athenaTestAddresses: `[{"addressCountry":"GB","addressLocality":"ABERDEEN","buildingName":"PERIGARTH","postalCode":"AB10 6QW","streetName":"PITSTRUAN TERRACE","uprn":"9051041658","validFrom":"2014-01-01"},{"addressCountry":"GB","addressLocality":"ABERDEEN","buildingName":"PERIGARTH","postalCode":"AB10 6QW","streetName":"PITSTRUAN TERRACE"}]`,
  athenaTestAddresses2: `[{"addressCountry":"GB","addressLocality":"ABERDEEN2","buildingName":"PERIGARTH2","postalCode":"AB20 6QW","streetName":"PITSTRUAN TERRACE 2","uprn":"9051041659","validFrom":"2014-01-02"},{"addressCountry":"GB","addressLocality":"ABERDEEN2","buildingName":"PERIGARTH2","postalCode":"AB20 6QW","streetName":"PITSTRUAN TERRACE2"}]`,
  athenaTestBirthDate: `"1981-07-28"`,
  athenaTestBirthDate2: `"1981-07-29"`,
  athenaTestBuildingName: `"PERIGARTH"`,
  athenaTestBuildingName2: `"PERIGARTH2"`,
  athenaTestName: `[{"nameParts":[{"type":"GivenName","value":"MICHELLE"},{"type":"FamilyName","value":"KABIR"}]}]`,
  athenaTestName2: `[{"nameParts":[{"type":"GivenName","value":"MICHELLE2"},{"type":"FamilyName","value":"KABIR2"}]}]`,
  athenaTestFileName: 'athena-query-test-data.gz',
  athenaTest2FileName: 'athena-query-test-data-2.gz',
  athenaTestPrefix: '2022/04/01',
  athenaTest2Prefix: '2022/05/01',
  dataCopyTestFileName: 'test-audit-data.gz',
  date: '2022-01-01',
  eventId: 'c9e2bf44-b95e-4f9a-81c4-cf02d42c1552',
  dataPaths:
    'restricted.this1.that1 restricted.this2.that2 restricted.this3.that3.those3',
  mockServerValues: {
    zendeskEndUserName: 'Txma-team2-ticf-analyst-dev',
    recipientName: 'Test User',
    recipientEmail: 'fake-ticf-recipient@test.gov.uk',
    requesterEmail: 'fake-ticf-analyst@test.gov.uk',
    requesterName: 'Txma-team2-ticf-analyst-dev'
  }
}

interface TestDataConstants {
  readonly athenaTestEventId1: string
  readonly athenaTestEventId2: string
  readonly athenaTestAddresses: string
  readonly athenaTestAddresses2: string
  readonly athenaTestBirthDate: string
  readonly athenaTestBirthDate2: string
  readonly athenaTestBuildingName: string
  readonly athenaTestBuildingName2: string
  readonly athenaTestName: string
  readonly athenaTestName2: string
  readonly athenaTestFileName: string
  readonly athenaTest2FileName: string
  readonly athenaTestPrefix: string
  readonly athenaTest2Prefix: string
  readonly date: string
  readonly dataCopyTestFileName: string
  readonly eventId: string
  readonly dataPaths: string
  readonly mockServerValues: MockServerValues
}

interface MockServerValues {
  readonly zendeskEndUserName: string
  readonly recipientName: string
  readonly recipientEmail: string
  readonly requesterEmail: string
  readonly requesterName: string
}
