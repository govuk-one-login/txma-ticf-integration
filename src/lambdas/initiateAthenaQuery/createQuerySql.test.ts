import { createQuerySql } from './createQuerySql'
import {
  noIdTestDataRequest,
  dataPathsTestDataRequest,
  testDataRequestWithNoDataPathsOrPiiTypes,
  testDataRequestWithAllValuesSet
} from '../../utils/tests/testDataRequest'
import { IdentifierTypes } from '../../types/dataRequestParams'
import {
  TEST_ATHENA_FORMATTED_DATE_1,
  TEST_ATHENA_FORMATTED_DATE_2
} from '../../utils/tests/testConstants'

describe('create Query SQL', () => {
  it.each([
    ['event_id', 'event_id,', 'event_id'],
    [
      'session_id',
      `event_id, json_extract(user, '$.session_id') as session_id,`,
      `json_extract_scalar(user, '$.session_id')`
    ],
    [
      'journey_id',
      `event_id, json_extract(user, '$.govuk_signin_journey_id') as govuk_signin_journey_id,`,
      `json_extract_scalar(user, '$.govuk_signin_journey_id')`
    ],
    [
      'user_id',
      `event_id, json_extract(user, '$.user_id') as user_id,`,
      `json_extract_scalar(user, '$.user_id')`
    ]
  ])(
    `returns a formatted SQL query if dataPaths and requested id type of %p is present`,
    (id, idSelectStatement, idWhereStatement) => {
      dataPathsTestDataRequest.identifierType = id as IdentifierTypes
      const idExtension = id.charAt(0)
      expect(createQuerySql(dataPathsTestDataRequest)).toEqual({
        sqlGenerated: true,
        sql: `SELECT datetime, ${idSelectStatement} json_extract(restricted, '$.user.firstName') as user_firstName, json_extract(restricted, '$.user.lastName') as user_lastName FROM test_database.test_table WHERE ${idWhereStatement} IN (?, ?) AND datetime IN (?)`,
        queryParameters: [
          `'123${idExtension}'`,
          `'456${idExtension}'`,
          `'${TEST_ATHENA_FORMATTED_DATE_1}'`
        ]
      })
    }
  )

  it.each([
    [
      'passport_number',
      `json_extract(restricted, '$.passport[0].documentNumber')`
    ],
    [
      'passport_expiry_date',
      `json_extract(restricted, '$.passport[0].expiryDate')`
    ],
    ['drivers_licence', `json_extract(restricted, '$.drivingPermit')`],
    ['dob', `json_extract(restricted, '$.birthDate[0].value')`],
    ['name', `json_extract(restricted, '$.name')`],
    ['addresses', `json_extract(restricted, '$.address')`]
  ])(
    `returns a formatted SQL query handling piiType of %p`,
    (piiType, piiSql) => {
      testDataRequestWithNoDataPathsOrPiiTypes.piiTypes = [piiType]
      expect(createQuerySql(testDataRequestWithNoDataPathsOrPiiTypes)).toEqual({
        sqlGenerated: true,
        sql: `SELECT datetime, event_id, ${piiSql} as ${piiType} FROM test_database.test_table WHERE event_id IN (?, ?) AND datetime IN (?)`,
        queryParameters: [`'123'`, `'456'`, `'${TEST_ATHENA_FORMATTED_DATE_1}'`]
      })
      testDataRequestWithNoDataPathsOrPiiTypes.piiTypes = []
    }
  )

  test('returns a formatted SQL query handling root dataPaths', () => {
    testDataRequestWithNoDataPathsOrPiiTypes.dataPaths = [
      'restricted',
      'timestamp_formatted'
    ]
    expect(createQuerySql(testDataRequestWithNoDataPathsOrPiiTypes)).toEqual({
      sqlGenerated: true,
      sql: `SELECT datetime, event_id, restricted, timestamp_formatted FROM test_database.test_table WHERE event_id IN (?, ?) AND datetime IN (?)`,
      queryParameters: [`'123'`, `'456'`, `'${TEST_ATHENA_FORMATTED_DATE_1}'`]
    })
    testDataRequestWithNoDataPathsOrPiiTypes.dataPaths = []
  })

  test('returns a formatted SQL query handling dataPaths and piiTypes', () => {
    testDataRequestWithNoDataPathsOrPiiTypes.dataPaths = [
      'restricted.user[0].firstName',
      'restricted.user[1].firstName'
    ]
    testDataRequestWithNoDataPathsOrPiiTypes.piiTypes = ['passport_number']
    expect(createQuerySql(testDataRequestWithNoDataPathsOrPiiTypes)).toEqual({
      sqlGenerated: true,
      sql: `SELECT datetime, event_id, json_extract(restricted, '$.user[0].firstName') as user0_firstName, json_extract(restricted, '$.user[1].firstName') as user1_firstName, json_extract(restricted, '$.passport[0].documentNumber') as passport_number FROM test_database.test_table WHERE event_id IN (?, ?) AND datetime IN (?)`,
      queryParameters: [`'123'`, `'456'`, `'${TEST_ATHENA_FORMATTED_DATE_1}'`]
    })
    testDataRequestWithNoDataPathsOrPiiTypes.dataPaths = []
    testDataRequestWithNoDataPathsOrPiiTypes.piiTypes = []
  })

  test('returns a formatted SQL query handling multiple dates', () => {
    expect(createQuerySql(testDataRequestWithAllValuesSet)).toEqual({
      sqlGenerated: true,
      sql: `SELECT datetime, event_id, path_to_data1, path_to_data2, json_extract(restricted, '$.passport[0].documentNumber') as passport_number FROM test_database.test_table WHERE event_id IN (?, ?) AND datetime IN (?,?)`,
      queryParameters: [
        `'123'`,
        `'456'`,
        `'${TEST_ATHENA_FORMATTED_DATE_1}'`,
        `'${TEST_ATHENA_FORMATTED_DATE_2}'`
      ]
    })
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
