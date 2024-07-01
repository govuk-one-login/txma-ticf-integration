import { isEmailInValidRecipientList } from './isEmailInValidRecipientList'
import { validateZendeskRequest } from './validateZendeskRequest'
import { IdentifierTypes } from '../../types/dataRequestParams'
import { when } from 'jest-when'
import {
  TEST_DATE_1,
  TEST_DATE_2,
  ZENDESK_PII_TYPE_PREFIX
} from '../../utils/tests/testConstants'

jest.mock('./isEmailInValidRecipientList', () => ({
  isEmailInValidRecipientList: jest.fn()
}))

describe('validateZendeskRequest', () => {
  const testValidResultsEmail = 'myname@example.gov.uk'
  const testNotInValidRecipientListEmail = 'someothername@example.gov.uk'
  const testResultsName = 'my resultsname'
  const testZendeskId = '123'
  interface RequestBody {
    zendeskId?: string
    recipientEmail?: string
    recipientName?: string
    requesterEmail?: string
    requesterName?: string
    identifierType?: IdentifierTypes
    dateFrom?: string
    dateTo?: string
    dates?: string
    piiTypes?: string
    dataPaths?: string
    eventIds?: string
    sessionIds?: string
    journeyIds?: string
    userIds?: string
  }

  const basicRequestBody: RequestBody = {
    zendeskId: testZendeskId,
    recipientEmail: testValidResultsEmail,
    recipientName: testResultsName,
    requesterEmail: testValidResultsEmail,
    requesterName: testResultsName,
    dates: `${TEST_DATE_1} ${TEST_DATE_2}`,
    journeyIds: '',
    eventIds: '',
    sessionIds: '',
    piiTypes: '',
    dataPaths: ''
  }

  const fieldKeys = [
    'zendeskId',
    'recipientEmail',
    'recipientName',
    'requesterEmail',
    'requesterName',
    'identifierType',
    'dates',
    'piiTypes',
    'dataPaths',
    'eventIds',
    'sessionIds',
    'journeyIds',
    'userIds'
  ]

  const buildValidRequestBodyWithIds = (
    identifierType: IdentifierTypes,
    spaceSeparatedIds: string,
    spaceSeparatedPiiTypes = '',
    spaceSeparatedDataPaths = 'myPath1.path'
  ) => {
    const objectToReturn: RequestBody = {
      ...basicRequestBody,
      identifierType,
      piiTypes: spaceSeparatedPiiTypes,
      dataPaths: spaceSeparatedDataPaths
    }
    const identifierTypeToObjectKeyMapping: { [key: string]: string } = {
      event_id: 'eventIds',
      journey_id: 'journeyIds',
      session_id: 'sessionIds',
      user_id: 'userIds'
    }
    const identifierObjectKey = identifierTypeToObjectKeyMapping[identifierType]
    return {
      ...objectToReturn,
      [identifierObjectKey]: spaceSeparatedIds
    }
  }

  const buildValidRequestBodyWithPiiTypes = (piiTypes: string) => {
    return buildValidRequestBodyWithIds(
      'session_id',
      'sessionId1 sessionId2 sessionId3',
      piiTypes
    )
  }

  const buildValidRequestBodyWithDataPaths = (dataPaths: string) => {
    return buildValidRequestBodyWithIds(
      'session_id',
      'sessionId1 sessionId2 sessionId3',
      '',
      dataPaths
    )
  }

  const buildRequestBodyWithDateList = (dateListString: string) => {
    const requestBody = buildValidRequestBodyWithIds('session_id', 'sessionId1')
    requestBody.dates = dateListString
    return requestBody
  }

  const buildRequestBodyWithDates = (dateFrom: string, dateTo: string) => {
    const requestBody = buildValidRequestBodyWithIds('session_id', 'sessionId1')
    requestBody.dateFrom = dateFrom
    requestBody.dateTo = dateTo
    return requestBody
  }

  const buildValidRequestBody = () =>
    buildValidRequestBodyWithIds('session_id', 'sessionId1')

  const runValidationWithInvalidRequestBody = async (
    requestBody: string | null
  ) => {
    const validationResult = await validateZendeskRequest(requestBody)
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual('No data in request')
  }

  const getTodayUtc = (): number => {
    const today = new Date()
    return Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  }

  const getTodayPlusDaysAsString = (days: number): string => {
    const date = new Date(getTodayUtc())
    date.setDate(date.getDate() + days)
    return getDateAsString(date)
  }

  const getTodayAsString = () => getDateAsString(new Date(getTodayUtc()))

  const getDateAsString = (date: Date): string =>
    `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`

  beforeEach(() => {
    when(isEmailInValidRecipientList)
      .calledWith(testValidResultsEmail)
      .mockResolvedValue(true)
      .defaultResolvedValue(false)
  })

  it('should return an invalid response if request body is null', () => {
    runValidationWithInvalidRequestBody(null)
  })

  it('should return an invalid response if request body is blank', () => {
    runValidationWithInvalidRequestBody('')
  })

  it('should return an invalid response if request body is malformed', () => {
    runValidationWithInvalidRequestBody('hello')
  })

  it.each([
    {
      rawIdentifierType: 'pii_identifier_event_id',
      identifierType: 'event_id'
    },
    {
      rawIdentifierType: 'pii_identifier_session_id',
      identifierType: 'session_id'
    },
    {
      rawIdentifierType: 'pii_identifier_journey_id',
      identifierType: 'journey_id'
    },
    { rawIdentifierType: 'pii_identifier_user_id', identifierType: 'user_id' }
  ])(
    'should accept %p as identifierType',
    async (parameters: {
      rawIdentifierType: string
      identifierType: string
    }) => {
      const testRequest = {
        zendeskId: '123',
        recipientEmail: 'myname@example.gov.uk',
        recipientName: 'my resultsname',
        requesterEmail: 'myname@example.gov.uk',
        requesterName: 'my resultsname',
        dateFrom: '2021-08-01',
        dateTo: '2021-08-01',
        eventIds: '',
        sessionIds: '',
        journeyIds: '',
        userIds: '',
        piiTypes: 'dob name passport_number',
        dataPaths: 'myPath1.path',
        identifierType: parameters.rawIdentifierType
      }

      const identifierTypeToObjectKeyMapping: { [key: string]: string } = {
        pii_identifier_event_id: 'eventIds',
        pii_identifier_journey_id: 'journeyIds',
        pii_identifier_session_id: 'sessionIds',
        pii_identifier_user_id: 'userIds'
      }
      const identifierObjectKey =
        identifierTypeToObjectKeyMapping[parameters.rawIdentifierType]

      const validationResult = await validateZendeskRequest(
        JSON.stringify({ ...testRequest, [identifierObjectKey]: 'id1 id2 id3' })
      )
      expect(validationResult.isValid).toBe(true)
      expect(validationResult.dataRequestParams?.identifierType).toEqual(
        parameters.identifierType
      )
    }
  )

  it('should parse data into response if request data is valid', async () => {
    const request = buildValidRequestBodyWithIds(
      'session_id',
      'sessionId1 sessionId2 sessionId3',
      'dob name passport_number'
    )

    const validationResult = await validateZendeskRequest(
      JSON.stringify(request)
    )

    const fields = Object.keys(validationResult.dataRequestParams ?? {})
    fields.map((field) => expect(fieldKeys).toContain(field))

    expect(validationResult.isValid).toEqual(true)

    expect(validationResult.dataRequestParams?.dates).toEqual([
      TEST_DATE_1,
      TEST_DATE_2
    ])
    expect(validationResult.dataRequestParams?.zendeskId).toEqual(testZendeskId)
    expect(validationResult.dataRequestParams?.recipientEmail).toEqual(
      testValidResultsEmail
    )
    expect(validationResult.dataRequestParams?.recipientName).toEqual(
      testResultsName
    )
    expect(validationResult.dataRequestParams?.identifierType).toEqual(
      'session_id'
    )
    expect(validationResult.dataRequestParams?.sessionIds).toBeDefined()
    expect(
      validationResult.dataRequestParams?.sessionIds?.length
    ).toBeGreaterThanOrEqual(0)

    expect(validationResult.dataRequestParams?.piiTypes).toEqual([
      'dob',
      'name',
      'passport_number'
    ])
  })

  it('should parse data into response if request contains sessionIds', async () => {
    const validationResult = await validateZendeskRequest(
      JSON.stringify(
        buildValidRequestBodyWithIds(
          'session_id',
          'sessionId1 sessionId2 sessionId3'
        )
      )
    )

    expect(validationResult.dataRequestParams?.sessionIds).toEqual([
      'sessionId1',
      'sessionId2',
      'sessionId3'
    ])
    expect(validationResult.dataRequestParams?.journeyIds).toEqual([])
    expect(validationResult.dataRequestParams?.eventIds).toEqual([])
  })

  it('should parse data into response if request contains a fromDate', async () => {
    const validationResult = await validateZendeskRequest(
      JSON.stringify(buildRequestBodyWithDates(TEST_DATE_1, TEST_DATE_1))
    )
    expect(validationResult.isValid).toEqual(true)
    expect(validationResult.dataRequestParams?.dates).toEqual([TEST_DATE_1])
  })

  it('should return an invalid response if request does not contain sessionIds when required', async () => {
    const requestBody = buildValidRequestBody()
    requestBody.identifierType = 'session_id'
    requestBody.sessionIds = ''
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'At least one session id should be provided'
    )
  })

  it.each([undefined, '', 'some_type'])(
    'should return an invalid response if request contains an invalid identifierType',
    async (identifierType: string | undefined) => {
      const requestBody = buildValidRequestBody()
      requestBody.identifierType = identifierType as IdentifierTypes
      requestBody.sessionIds = ''
      const validationResult = await validateZendeskRequest(
        JSON.stringify(requestBody)
      )
      expect(validationResult.isValid).toEqual(false)
      expect(validationResult.validationMessage).toContain(
        'Identifier type is invalid'
      )
    }
  )

  it('should return an invalid response if request does not contain journeyIds when required', async () => {
    const requestBody = buildValidRequestBody()
    requestBody.identifierType = 'journey_id'
    requestBody.journeyIds = ''
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'At least one journey id should be provided'
    )
  })

  it('should return an invalid response if request does not contain eventIds when required', async () => {
    const requestBody = buildValidRequestBody()
    requestBody.identifierType = 'event_id'
    requestBody.eventIds = ''
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'At least one event id should be provided'
    )
  })

  it('should return an invalid response if request does not contain userIds when required', async () => {
    const requestBody = buildValidRequestBody()
    requestBody.identifierType = 'user_id'
    requestBody.userIds = ''
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'At least one user id should be provided'
    )
  })

  it('should parse data into response if request contains journeyIds', async () => {
    const validationResult = await validateZendeskRequest(
      JSON.stringify(
        buildValidRequestBodyWithIds(
          'journey_id',
          'journeyId1 journeyId2 journeyId3'
        )
      )
    )

    expect(validationResult.dataRequestParams?.journeyIds).toEqual([
      'journeyId1',
      'journeyId2',
      'journeyId3'
    ])
    expect(validationResult.dataRequestParams?.eventIds).toEqual([])
    expect(validationResult.dataRequestParams?.sessionIds).toEqual([])
    expect(validationResult.dataRequestParams?.userIds).toEqual([])
  })

  it('should parse data into response if request contains eventIds', async () => {
    const validationResult = await validateZendeskRequest(
      JSON.stringify(buildValidRequestBodyWithIds('event_id', 'id1 id2 id3'))
    )

    expect(validationResult.dataRequestParams?.eventIds).toEqual([
      'id1',
      'id2',
      'id3'
    ])
  })

  it('should parse data into response if request contains userIds', async () => {
    const validationResult = await validateZendeskRequest(
      JSON.stringify(
        buildValidRequestBodyWithIds('user_id', 'userId1 userId2 userId3')
      )
    )

    expect(validationResult.dataRequestParams?.userIds).toEqual([
      'userId1',
      'userId2',
      'userId3'
    ])
  })

  it.each([
    'passport_number',
    'passport_expiry_date',
    'drivers_licence',
    'name',
    'dob',
    'addresses',
    `${ZENDESK_PII_TYPE_PREFIX}passport_number`,
    `${ZENDESK_PII_TYPE_PREFIX}passport_number`,
    `${ZENDESK_PII_TYPE_PREFIX}passport_expiry_date`,
    `${ZENDESK_PII_TYPE_PREFIX}drivers_licence`,
    `${ZENDESK_PII_TYPE_PREFIX}name`,
    `${ZENDESK_PII_TYPE_PREFIX}dob`,
    `${ZENDESK_PII_TYPE_PREFIX}addresses`
  ])(
    `should return a valid response if piiTypes contains %p`,
    async (type: string) => {
      const validationResult = await validateZendeskRequest(
        JSON.stringify(buildValidRequestBodyWithPiiTypes(type))
      )
      expect(validationResult.isValid).toEqual(true)
    }
  )

  it('should remove the Zendesk prefix from the PII type if it is found', async () => {
    const validationResult = await validateZendeskRequest(
      JSON.stringify(
        buildValidRequestBodyWithPiiTypes(
          `${ZENDESK_PII_TYPE_PREFIX}passport_number`
        )
      )
    )
    expect(validationResult.isValid).toEqual(true)
    expect(validationResult.dataRequestParams?.piiTypes).toEqual([
      'passport_number'
    ])
  })

  it('should return an invalid response if piiTypes contains an invalid value', async () => {
    const validationResult = await validateZendeskRequest(
      JSON.stringify(
        buildValidRequestBodyWithPiiTypes('passport_number something')
      )
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'invalid PII type specified'
    )
  })

  it('should return a valid response with dataPaths set', async () => {
    const validationResult = await validateZendeskRequest(
      JSON.stringify(
        buildValidRequestBodyWithDataPaths(
          'myPath myPath.path1 myPath.path2[0].path2'
        )
      )
    )

    expect(validationResult.isValid).toEqual(true)
    expect(validationResult.dataRequestParams?.dataPaths).toEqual([
      'myPath',
      'myPath.path1',
      'myPath.path2[0].path2'
    ])
  })

  it(`should handle dataPaths containing multiple white space`, async () => {
    const validationResult = await validateZendeskRequest(
      JSON.stringify(
        buildValidRequestBodyWithDataPaths(
          'myPath.path1   myPath.path2[0].path2'
        )
      )
    )
    expect(validationResult.isValid).toEqual(true)
    expect(validationResult.dataRequestParams?.dataPaths).toEqual([
      'myPath.path1',
      'myPath.path2[0].path2'
    ])
  })

  it.each(['', ' ', '  '])(
    `should handle dataPaths containing empty string '%p'`,
    async (dataPath: string) => {
      const validationResult = await validateZendeskRequest(
        JSON.stringify(
          buildValidRequestBodyWithIds(
            'session_id',
            'sessionId1 sessionId2 sessionId3',
            'passport_number',
            dataPath
          )
        )
      )
      expect(validationResult.isValid).toEqual(true)
      expect(validationResult.dataRequestParams?.dataPaths).toEqual([])
    }
  )

  it.each(['badPath.', '.badPath2', 'badPath3[.path'])(
    `should return an invalid response if dataPaths contains an invalid dataPath of $p`,
    async (dataPath: string) => {
      const validationResult = await validateZendeskRequest(
        JSON.stringify(buildValidRequestBodyWithDataPaths(dataPath))
      )
      expect(validationResult.isValid).toEqual(false)
      expect(validationResult.validationMessage).toEqual('Invalid Data Path')
    }
  )

  it('should return an invalid response if neither a dateFrom or dates property is passed', async () => {
    const validRequestBody = buildValidRequestBody()
    validRequestBody.dateFrom = undefined
    validRequestBody.dates = undefined
    const validationResult = await validateZendeskRequest(
      JSON.stringify(validRequestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual('No dates supplied')
  })

  const invalidDates = ['blah', '01-08-2021']

  it.each(invalidDates)(
    `should return an invalid response if an invalid fromDate of %p is passed`,
    async (date: string) => {
      const validationResult = await validateZendeskRequest(
        JSON.stringify(buildRequestBodyWithDates(date, '2021-08-01'))
      )
      expect(validationResult.isValid).toEqual(false)
      expect(validationResult.validationMessage).toEqual('From date is invalid')
    }
  )

  const invalidDateLists = [
    'blah',
    '01-08-2021',
    '01-08-2021 2022-08-01',
    '2022-08-012022-09-01'
  ]
  it.each(invalidDateLists)(
    `should return an invalid response if an invalid dates list of %p is passed`,
    async (dateListString: string) => {
      const validationResult = await validateZendeskRequest(
        JSON.stringify(buildRequestBodyWithDateList(dateListString))
      )
      expect(validationResult.isValid).toEqual(false)
      expect(validationResult.validationMessage).toEqual(
        'dates list is invalid'
      )
    }
  )

  const todayDateString = getTodayAsString()
  const tomorrowDateString = getTodayPlusDaysAsString(1)
  it(`should return an invalid response if fromDate is ${tomorrowDateString} after today ${todayDateString}`, async () => {
    const dayAfterTomorrowDateString = getTodayPlusDaysAsString(2)
    const validationResult = await validateZendeskRequest(
      JSON.stringify(
        buildRequestBodyWithDates(
          tomorrowDateString,
          dayAfterTomorrowDateString
        )
      )
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toContain(
      'From Date is in the future'
    )
  })

  it(`should return an invalid response if one of the dates in the date list is in the future`, async () => {
    const dayAfterTomorrowDateString = getTodayPlusDaysAsString(2)
    const twoDaysAgoDateString = getTodayPlusDaysAsString(-2)
    const validationResult = await validateZendeskRequest(
      JSON.stringify(
        buildRequestBodyWithDateList(
          `${dayAfterTomorrowDateString} ${twoDaysAgoDateString}`
        )
      )
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toContain(
      'One of the requested dates is in the future'
    )
  })

  it('should return an invalid response if recipientEmail is not set', async () => {
    const requestBody = buildValidRequestBody()
    delete requestBody.recipientEmail
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'Recipient email format invalid'
    )
  })

  it('should return an invalid response if requesterEmail is not set', async () => {
    const requestBody = buildValidRequestBody()
    delete requestBody.requesterEmail
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'Requester email format invalid'
    )
  })

  it('should return an invalid response if recipientEmail is not valid', async () => {
    const requestBody = buildValidRequestBody()
    requestBody.recipientEmail = 'notanemail'
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'Recipient email format invalid'
    )
  })

  it('should return an invalid response if requesterEmail is not valid', async () => {
    const requestBody = buildValidRequestBody()
    requestBody.requesterEmail = 'notanemail'
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'Requester email format invalid'
    )
  })

  it('should return an invalid response if recipientEmail is not for a .gov.uk domain', async () => {
    const requestBody = buildValidRequestBody()
    requestBody.recipientEmail = 'someperson@example.com'
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'Recipient email format invalid'
    )
  })

  it('should return an invalid response if recipientEmail is not in the valid recipient list', async () => {
    const requestBody = buildValidRequestBody()
    requestBody.recipientEmail = testNotInValidRecipientListEmail
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'Recipient email not in valid recipient list'
    )
  })

  it('should return an invalid response if requesterEmail is not for a .gov.uk domain', async () => {
    const requestBody = buildValidRequestBody()
    requestBody.requesterEmail = 'someperson@example.com'
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'Requester email format invalid'
    )
  })

  it('should return an invalid response if recipientName is blank', async () => {
    const requestBody = buildValidRequestBody()
    requestBody.recipientName = ''
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'Recipient name is missing'
    )
  })

  it('should return an invalid response if requesterName is blank', async () => {
    const requestBody = buildValidRequestBody()
    requestBody.requesterName = ''
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'Requester name is missing'
    )
  })

  it('should return an invalid response if recipientName is not set', async () => {
    const requestBody = buildValidRequestBody()
    delete requestBody.recipientName
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'Recipient name is missing'
    )
  })

  it('should return an invalid response if requesterName is not set', async () => {
    const requestBody = buildValidRequestBody()
    delete requestBody.requesterName
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'Requester name is missing'
    )
  })

  it('should return an invalid response if neither piiTypes or dataPaths are set', async () => {
    const requestBody = buildValidRequestBody()
    requestBody.piiTypes = ''
    requestBody.dataPaths = ''
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'PII types and/or Data Paths must be set'
    )
  })

  it('should return an invalid response if piiTypes and dataPaths properties are missing', async () => {
    const requestBody = buildValidRequestBody()
    delete requestBody.dataPaths
    const validationResult = await validateZendeskRequest(
      JSON.stringify(requestBody)
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'PII types and/or Data Paths must be set'
    )
  })
})
