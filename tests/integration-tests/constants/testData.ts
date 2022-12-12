export const testData: TestDataConstants = {
  athenaTestAddresses: `[{"uprn":"9051041658","buildingname":"PERIGARTH","streetname":"PITSTRUAN TERRACE","addresslocality":"ABERDEEN","postalcode":"AB10 6QW","addresscountry":"GB","validfrom":"2014-01-01"},{"buildingname":"PERIGARTH","streetname":"PITSTRUAN TERRACE","addresslocality":"ABERDEEN","postalcode":"AB10 6QW","addresscountry":"GB"}]`,
  athenaTestBirthDate: `"1981-07-28"`,
  athenaTestBuildingName: `"PERIGARTH"`,
  athenaTestName: `[{"nameparts":[{"type":"GivenName","value":"MICHELLE"},{"type":"FamilyName","value":"KABIR"}]}]`,
  athenaTestFileName: 'athena-query-test-data.gz',
  athenaTestPrefix: '2022/04/01',
  dataCopyTestFileName: 'test-audit-data.gz',
  date: '2022-01-01',
  eventId: 'c9e2bf44-b95e-4f9a-81c4-cf02d42c1552',
  dataPaths:
    'restricted.this1.that1 restricted.this2.that2 restricted.this3.that3.those3'
}

type TestDataConstants = {
  readonly athenaTestAddresses: string
  readonly athenaTestBirthDate: string
  readonly athenaTestBuildingName: string
  readonly athenaTestName: string
  readonly athenaTestFileName: string
  readonly athenaTestPrefix: string
  readonly date: string
  readonly dataCopyTestFileName: string
  readonly eventId: string
  readonly dataPaths: string
}
