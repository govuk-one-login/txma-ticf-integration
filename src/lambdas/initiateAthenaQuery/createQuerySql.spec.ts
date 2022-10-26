import { createQuerySql } from './createQuerySql'
import {
  noIdTestDataRequest,
  dataPathsTestDataRequest,
  testDataRequestWithNoDataPathsOrPiiTypes
} from '../../utils/tests/testDataRequest'
import { IdentifierTypes } from '../../types/dataRequestParams'
import {
  TEST_FORMATTED_DATE_FROM,
  TEST_FORMATTED_DATE_TO
} from '../../utils/tests/testConstants'

describe('create Query SQL', () => {
  it.each(['event_id', 'session_id', 'journey_id', 'user_id'])(
    `returns a formatted SQL query if dataPaths and requested id type of %p is present`,
    (id) => {
      dataPathsTestDataRequest.identifierType = id as IdentifierTypes
      const idExtension = id.charAt(0)
      expect(createQuerySql(dataPathsTestDataRequest)).toEqual({
        sqlGenerated: true,
        sql: `SELECT event_id, json_extract(restricted, '$.user.firstName') as user_firstname, json_extract(restricted, '$.user.lastName') as user_lastname FROM test_database.test_table WHERE ${id} IN (?, ?) AND datetime >= ? AND datetime <= ?`,
        queryParameters: [
          `123${idExtension}`,
          `456${idExtension}`,
          `'${TEST_FORMATTED_DATE_FROM}'`,
          `'${TEST_FORMATTED_DATE_TO}'`
        ]
      })
    }
  )

  it.each([
    [
      'passport_number',
      `json_extract(restricted, '$.passport[0].documentnumber')`
    ],
    [
      'passport_expiry_date',
      `json_extract(restricted, '$.passport[0].expirydate')`
    ],
    ['drivers_license', `json_extract(restricted, '$.drivingpermit')`],
    ['dob', `json_extract(restricted, '$.birthdate[0].value')`],
    ['name', `json_extract(restricted, '$.name')`],
    ['current_address', `json_extract(restricted, '$.address')`],
    ['previous_address', `json_extract(restricted, '$.address')`]
  ])(
    `returns a formatted SQL query handling piiType of %p`,
    (piiType, piiSql) => {
      testDataRequestWithNoDataPathsOrPiiTypes.piiTypes = [piiType]
      expect(createQuerySql(testDataRequestWithNoDataPathsOrPiiTypes)).toEqual({
        sqlGenerated: true,
        sql: `SELECT event_id, ${piiSql} as ${piiType} FROM test_database.test_table WHERE event_id IN (?, ?) AND datetime >= ? AND datetime <= ?`,
        queryParameters: [
          '123',
          '456',
          `'${TEST_FORMATTED_DATE_FROM}'`,
          `'${TEST_FORMATTED_DATE_TO}'`
        ]
      })
      testDataRequestWithNoDataPathsOrPiiTypes.piiTypes = []
    }
  )

  test('returns a formatted SQL query handling dataPaths and piiTypes', () => {
    testDataRequestWithNoDataPathsOrPiiTypes.dataPaths = [
      'restricted.user.firstName'
    ]
    testDataRequestWithNoDataPathsOrPiiTypes.piiTypes = ['passport_number']
    expect(createQuerySql(testDataRequestWithNoDataPathsOrPiiTypes)).toEqual({
      sqlGenerated: true,
      sql: `SELECT event_id, json_extract(restricted, '$.user.firstName') as user_firstname, json_extract(restricted, '$.passport[0].documentnumber') as passport_number FROM test_database.test_table WHERE event_id IN (?, ?) AND datetime >= ? AND datetime <= ?`,
      queryParameters: [
        '123',
        '456',
        `'${TEST_FORMATTED_DATE_FROM}'`,
        `'${TEST_FORMATTED_DATE_TO}'`
      ]
    })
    testDataRequestWithNoDataPathsOrPiiTypes.dataPaths = []
    testDataRequestWithNoDataPathsOrPiiTypes.piiTypes = []
  })

  test('returns an error message if there are no dataPaths or piiTypes', () => {
    expect(createQuerySql(testDataRequestWithNoDataPathsOrPiiTypes)).toEqual({
      sqlGenerated: false,
      error: 'No dataPaths or piiTypes in request'
    })
  })

  it.each(['event_id', 'session_id', 'journey_id', 'user_id'])(
    `returns an error message if there are no ids corresponding to %p`,
    (id) => {
      noIdTestDataRequest.identifierType = id as IdentifierTypes
      expect(createQuerySql(noIdTestDataRequest)).toEqual({
        sqlGenerated: false,
        error: `No ids of type: ${id}`
      })
    }
  )
})
