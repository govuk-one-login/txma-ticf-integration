export const testData: TestDataConstants = {
  athenaTestEventId1: '99cbfa88-5277-422f-af25-be0864adb7db',
  athenaTestEventId2: 'e9919603-77ab-4cd2-8f3a-b3fda80fa39c',
  athenaTestAddresses: `[{"uprn":"9051041658","buildingname":"PERIGARTH","streetname":"PITSTRUAN TERRACE","addresslocality":"ABERDEEN","postalcode":"AB10 6QW","addresscountry":"GB","validfrom":"2014-01-01"},{"buildingname":"PERIGARTH","streetname":"PITSTRUAN TERRACE","addresslocality":"ABERDEEN","postalcode":"AB10 6QW","addresscountry":"GB"}]`,
  athenaTestAddresses2: `[{"uprn":"9051041659","buildingname":"PERIGARTH2","streetname":"PITSTRUAN TERRACE 2","addresslocality":"ABERDEEN2","postalcode":"AB20 6QW","addresscountry":"GB","validfrom":"2014-01-02"},{"buildingname":"PERIGARTH2","streetname":"PITSTRUAN TERRACE2","addresslocality":"ABERDEEN2","postalcode":"AB20 6QW","addresscountry":"GB"}]`,
  athenaTestBirthDate: `"1981-07-28"`,
  athenaTestBirthDate2: `"1981-07-29"`,
  athenaTestBuildingName: `"PERIGARTH"`,
  athenaTestBuildingName2: `"PERIGARTH2"`,
  athenaTestName: `[{"nameparts":[{"type":"GivenName","value":"MICHELLE"},{"type":"FamilyName","value":"KABIR"}]}]`,
  athenaTestName2: `[{"nameparts":[{"type":"GivenName","value":"MICHELLE2"},{"type":"FamilyName","value":"KABIR2"}]}]`,
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
    recipientEmail: 'fake-ticf-recipient@example.com',
    requesterEmail: 'fake-ticf-analyst@example.com',
    requesterName: 'Txma-team2-ticf-analyst-dev'
  }
}

type TestDataConstants = {
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

type MockServerValues = {
  readonly zendeskEndUserName: string
  readonly recipientName: string
  readonly recipientEmail: string
  readonly requesterEmail: string
  readonly requesterName: string
}
