import { validateZendeskRequest } from './validateZendeskRequest'
import { IdentifierTypes } from '../types/dataRequestParams'
describe('validateZendeskRequest', () => {
  const testValidResultsEmail = 'myname@somedomain.gov.uk'
  const testResultsName = 'my resultsname'
  const testZendeskId = '123'
  interface RequestBody {
    zendeskId?: string
    resultsEmail?: string
    resultsName?: string
    dateFrom?: string
    dateTo?: string
  }
  const basicRequestBody: RequestBody = {
    zendeskId: testZendeskId,
    resultsEmail: testValidResultsEmail,
    resultsName: testResultsName,
    dateFrom: '2021-08-01',
    dateTo: '2021-08-01'
  }

  const buildValidRequestBodyWithIds = (
    identifierType: IdentifierTypes,
    spaceSeparatedIds: string,
    spaceSeparatedPiiTypes = '',
    spaceSeparatedDataPaths = ''
  ) => {
    const objectToReturn = {
      ...basicRequestBody,
      identifierType,
      piiTypes: spaceSeparatedPiiTypes,
      dataPaths: spaceSeparatedDataPaths
    }
    const identifierTypeToObjectKeyMapping: { [key: string]: string } = {
      event_id: 'eventIds',
      journey_id: 'journeyIds',
      session_id: 'sessionIds'
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

  const buildRequestBodyWithDates = (dateFrom: string, dateTo: string) => {
    const requestBody = buildValidRequestBodyWithIds('session_id', 'sessionId1')
    requestBody.dateFrom = dateFrom
    requestBody.dateTo = dateTo
    return requestBody
  }

  const buildValidRequestBody = () =>
    buildValidRequestBodyWithIds('session_id', 'sessionId1')

  it('should parse data into response if request data is valid', () => {
    const validationResult = validateZendeskRequest(
      JSON.stringify(
        buildValidRequestBodyWithIds(
          'session_id',
          'sessionId1 sessionId2 sessionId3',
          'dob name passport_number'
        )
      )
    )
    console.log('validation message is ', validationResult.validationMessage)
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
})
