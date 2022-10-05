import { validateZendeskRequest } from './validateZendeskRequest'
import { IdentifierTypes } from '../../types/dataRequestParams'
describe('validateZendeskRequest', () => {
  const testValidResultsEmail = 'myname@somedomain.gov.uk'
  const testResultsName = 'my resultsname'
  const testZendeskId = '123'
  interface RequestBody {
    zendeskId?: string
    resultsEmail?: string
    resultsName?: string
    identifierType?: IdentifierTypes
    dateFrom?: string
    dateTo?: string
    piiTypes?: string
    dataPaths?: string
    eventIds?: string
    sessionIds?: string
    journeyIds?: string
    userIds?: string
  }

  const basicRequestBody: RequestBody = {
    zendeskId: testZendeskId,
    resultsEmail: testValidResultsEmail,
    resultsName: testResultsName,
    dateFrom: '2021-08-01',
    dateTo: '2021-08-01'
  }

  const fieldKeys = [
    'zendeskId',
    'resultsEmail',
    'resultsName',
    'identifierType',
    'dateFrom',
    'dateTo',
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

  const buildRequestBodyWithDates = (dateFrom: string, dateTo: string) => {
    const requestBody = buildValidRequestBodyWithIds('session_id', 'sessionId1')
    requestBody.dateFrom = dateFrom
    requestBody.dateTo = dateTo
    return requestBody
  }

  const buildValidRequestBody = () =>
    buildValidRequestBodyWithIds('session_id', 'sessionId1')

  const runValidationWithInvalidRequestBody = (requestBody: string | null) => {
    const validationResult = validateZendeskRequest(requestBody)
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

  it('should return an invalid response if request body is null', () => {
    runValidationWithInvalidRequestBody(null)
  })

  it('should return an invalid response if request body is blank', () => {
    runValidationWithInvalidRequestBody('')
  })

  it('should return an invalid response if request body is malformed', () => {
    runValidationWithInvalidRequestBody('hello')
  })

  it('should parse data into response if request data is valid', () => {
    console.log(
      'here is the request',
      JSON.stringify(
        buildValidRequestBodyWithIds(
          'session_id',
          'sessionId1 sessionId2 sessionId3',
          'dob name passport_number'
        )
      )
    )

    const validationResult = validateZendeskRequest(
      JSON.stringify(
        buildValidRequestBodyWithIds(
          'session_id',
          'sessionId1 sessionId2 sessionId3',
          'dob name passport_number'
        )
      )
    )

    const fields = Object.keys(validationResult.dataRequestParams ?? {})
    fields.map((field) => expect(fieldKeys).toContain(field))

    expect(validationResult.isValid).toEqual(true)

    expect(validationResult.dataRequestParams?.dateFrom).toEqual('2021-08-01')
    expect(validationResult.dataRequestParams?.dateTo).toEqual('2021-08-01')
    expect(validationResult.dataRequestParams?.zendeskId).toEqual(testZendeskId)
    expect(validationResult.dataRequestParams?.resultsEmail).toEqual(
      testValidResultsEmail
    )
    expect(validationResult.dataRequestParams?.resultsName).toEqual(
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

  it('should parse data into response if request contains sessionIds', () => {
    const validationResult = validateZendeskRequest(
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
    expect(validationResult.dataRequestParams?.journeyIds).toBeUndefined()
    expect(validationResult.dataRequestParams?.eventIds).toBeUndefined()
  })

  it('should return an invalid response if request does not contain sessionIds when required', () => {
    const requestBody = buildValidRequestBody()
    requestBody.identifierType = 'session_id'
    requestBody.sessionIds = ''
    const validationResult = validateZendeskRequest(JSON.stringify(requestBody))
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'At least one session id should be provided'
    )
  })

  it('should return an invalid response if request does not contain journeyIds when required', () => {
    const requestBody = buildValidRequestBody()
    requestBody.identifierType = 'journey_id'
    requestBody.journeyIds = ''
    const validationResult = validateZendeskRequest(JSON.stringify(requestBody))
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'At least one journey id should be provided'
    )
  })

  it('should return an invalid response if request does not contain eventIds when required', () => {
    const requestBody = buildValidRequestBody()
    requestBody.identifierType = 'event_id'
    requestBody.eventIds = ''
    const validationResult = validateZendeskRequest(JSON.stringify(requestBody))
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'At least one event id should be provided'
    )
  })

  it('should return an invalid response if request does not contain userIds when required', () => {
    const requestBody = buildValidRequestBody()
    requestBody.identifierType = 'user_id'
    requestBody.userIds = ''
    const validationResult = validateZendeskRequest(JSON.stringify(requestBody))
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'At least one user id should be provided'
    )
  })

  it('should parse data into response if request contains journeyIds', () => {
    const validationResult = validateZendeskRequest(
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
    expect(validationResult.dataRequestParams?.eventIds).toBeUndefined()
    expect(validationResult.dataRequestParams?.sessionIds).toBeUndefined()
    expect(validationResult.dataRequestParams?.userIds).toBeUndefined()
  })

  it('should parse data into response if request contains eventIds', () => {
    const validationResult = validateZendeskRequest(
      JSON.stringify(buildValidRequestBodyWithIds('event_id', 'id1 id2 id3'))
    )

    expect(validationResult.dataRequestParams?.eventIds).toEqual([
      'id1',
      'id2',
      'id3'
    ])
  })

  it('should parse data into response if request contains userIds', () => {
    const validationResult = validateZendeskRequest(
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

  const validPiiTypes = [
    'passport_number',
    'passport_expiry_date',
    'drivers_license',
    'name',
    'dob',
    'current_address',
    'previous_address'
  ]
  validPiiTypes.forEach((type) => {
    it(`should return a valid response if piiTypes contains ${type}`, () => {
      const validationResult = validateZendeskRequest(
        JSON.stringify(buildValidRequestBodyWithPiiTypes(type))
      )
      expect(validationResult.isValid).toEqual(true)
    })
  })

  it('should return an invalid response if piiTypes contains an invalid value', () => {
    const validationResult = validateZendeskRequest(
      JSON.stringify(
        buildValidRequestBodyWithPiiTypes('passport_number something')
      )
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'invalid PII type specified'
    )
  })

  it('should return a valid response with dataPaths set', () => {
    const validationResult = validateZendeskRequest(
      JSON.stringify(
        buildValidRequestBodyWithDataPaths('myPath.path1 myPath.path2')
      )
    )

    expect(validationResult.isValid).toEqual(true)
    expect(validationResult.dataRequestParams?.dataPaths).toEqual([
      'myPath.path1',
      'myPath.path2'
    ])
  })

  const invalidDates = ['', 'blah', '01-08-2021']
  invalidDates.forEach((date) =>
    it(`should return an invalid response if an invalid fromDate of ${date} is passed`, () => {
      const validationResult = validateZendeskRequest(
        JSON.stringify(buildRequestBodyWithDates(date, '2021-08-01'))
      )
      console.log(validationResult.validationMessage)
      expect(validationResult.isValid).toEqual(false)
      expect(validationResult.validationMessage).toEqual('From date is invalid')
    })
  )

  invalidDates.forEach((date) =>
    it(`should return an invalid response if an invalid toDate of ${date} is passed`, () => {
      const validationResult = validateZendeskRequest(
        JSON.stringify(buildRequestBodyWithDates('2021-08-01', date))
      )
      expect(validationResult.isValid).toEqual(false)
      expect(validationResult.validationMessage).toEqual('To date is invalid')
    })
  )

  const todayDateString = getTodayAsString()
  const tomorrowDateString = getTodayPlusDaysAsString(1)
  it(`should return an invalid response if fromDate is ${tomorrowDateString} after today ${todayDateString}`, () => {
    const dayAfterTomorrowDateString = getTodayPlusDaysAsString(2)
    const validationResult = validateZendeskRequest(
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

  it(`should return an invalid response if toDate is ${tomorrowDateString}, after today ${todayDateString}`, () => {
    const validationResult = validateZendeskRequest(
      JSON.stringify(
        buildRequestBodyWithDates(todayDateString, tomorrowDateString)
      )
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toContain(
      'To Date is in the future'
    )
  })

  it('should return an invalid response if toDate is before fromDate', () => {
    const validationResult = validateZendeskRequest(
      JSON.stringify(buildRequestBodyWithDates('2021-08-01', '2021-07-30'))
    )
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'To Date is before From Date'
    )
  })
  it('should return an invalid response if resultsEmail is not set', () => {
    const requestBody = buildValidRequestBody()
    delete requestBody.resultsEmail
    const validationResult = validateZendeskRequest(JSON.stringify(requestBody))
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual('Email format invalid')
  })

  it('should return an invalid response if resultsEmail is not valid', () => {
    const requestBody = buildValidRequestBody()
    requestBody.resultsEmail = 'notanemail'
    const validationResult = validateZendeskRequest(JSON.stringify(requestBody))
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual('Email format invalid')
  })

  it('should return an invalid response if resultsEmail is not for a .gov.uk domain', () => {
    const requestBody = buildValidRequestBody()
    requestBody.resultsEmail = 'someperson@test.com'
    const validationResult = validateZendeskRequest(JSON.stringify(requestBody))
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual('Email format invalid')
  })

  it('should return an invalid response if resultsName is blank', () => {
    const requestBody = buildValidRequestBody()
    requestBody.resultsName = ''
    const validationResult = validateZendeskRequest(JSON.stringify(requestBody))
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'Results Name is missing'
    )
  })

  it('should return an invalid response if resultsName is not set', () => {
    const requestBody = buildValidRequestBody()
    delete requestBody.resultsName
    const validationResult = validateZendeskRequest(JSON.stringify(requestBody))
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'Results Name is missing'
    )
  })

  it('should return an invalid response if neither piiTypes or dataPaths are set', () => {
    const requestBody = buildValidRequestBody()
    requestBody.piiTypes = ''
    requestBody.dataPaths = ''
    const validationResult = validateZendeskRequest(JSON.stringify(requestBody))
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'PII types and/or Data Paths must be set'
    )
  })

  it('should return an invalid response if piiTypes and dataPaths properties are missing', () => {
    const requestBody = buildValidRequestBody()
    delete requestBody.dataPaths
    const validationResult = validateZendeskRequest(JSON.stringify(requestBody))
    expect(validationResult.isValid).toEqual(false)
    expect(validationResult.validationMessage).toEqual(
      'PII types and/or Data Paths must be set'
    )
  })
})
