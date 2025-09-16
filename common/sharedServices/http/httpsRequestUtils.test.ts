import https from 'node:https'
import { EventEmitter } from 'events'
import {
  base64Encode,
  makeHttpsRequest
} from '../../../common/sharedServices/http/httpsRequestUtils'

jest.mock('node:https')

describe('#base64Encode', () => {
  it('returns the correctly encoded value along with the "Basic " prefix', () => {
    const value = 'test.user@example.email.com/token:aBcDe12345F6g7H8i9'
    const encodedValue =
      'Basic ' +
      'dGVzdC51c2VyQGV4YW1wbGUuZW1haWwuY29tL3Rva2VuOmFCY0RlMTIzNDVGNmc3SDhpOQ=='
    expect(base64Encode(value)).toEqual(encodedValue)
  })
})

describe('#makeHttpsRequest', () => {
  let mockRequest: {
    write: jest.Mock
    end: jest.Mock
  }
  let mockResponse: EventEmitter & {
    statusCode?: number
    setEncoding: jest.Mock
  }

  beforeEach(() => {
    mockRequest = {
      write: jest.fn(),
      end: jest.fn()
    }

    mockResponse = Object.assign(new EventEmitter(), {
      statusCode: 200,
      setEncoding: jest.fn()
    })
    ;(https.request as jest.Mock).mockImplementation((options, callback) => {
      if (callback && typeof callback === 'function') {
        process.nextTick(() => callback(mockResponse))
      }
      return mockRequest
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should make a successful request and return parsed JSON', async () => {
    const options = { host: 'example.com', path: '/test' }
    const responseData = { success: true }

    const requestPromise = makeHttpsRequest(options)

    process.nextTick(() => {
      mockResponse.emit('data', JSON.stringify(responseData))
      mockResponse.emit('end')
    })

    const result = await requestPromise
    expect(result).toEqual(responseData)
    expect(mockResponse.setEncoding).toHaveBeenCalledWith('utf-8')
  })

  it('should handle empty response body', async () => {
    const options = { host: 'example.com', path: '/test' }

    const requestPromise = makeHttpsRequest(options)

    process.nextTick(() => {
      mockResponse.emit('data', '')
      mockResponse.emit('end')
    })

    const result = await requestPromise
    expect(result).toEqual({})
  })

  it('should send POST data when provided', async () => {
    const options = { host: 'example.com', path: '/test', method: 'POST' }
    const postData = { key: 'value' }

    const requestPromise = makeHttpsRequest(options, postData)

    process.nextTick(() => {
      mockResponse.emit('data', '{"success": true}')
      mockResponse.emit('end')
    })

    await requestPromise
    expect(mockRequest.write).toHaveBeenCalledWith(JSON.stringify(postData))
    expect(mockRequest.end).toHaveBeenCalled()
  })

  it('should reject when response statusCode is undefined', async () => {
    const options = { host: 'example.com', path: '/test' }
    mockResponse.statusCode = undefined

    await expect(makeHttpsRequest(options)).rejects.toThrow(
      "Error making HTTPS request. Response or statusCode undefined. Host:'example.com', path:'/test'."
    )
  })

  it('should reject when response statusCode is < 200', async () => {
    const options = { host: 'example.com', path: '/test' }
    mockResponse.statusCode = 199

    await expect(makeHttpsRequest(options)).rejects.toThrow(
      "Error making HTTPS request, response statusCode: '199', host:'example.com', path:'/test'"
    )
  })

  it('should reject when response statusCode is >= 300', async () => {
    const options = { host: 'example.com', path: '/test' }
    mockResponse.statusCode = 404

    await expect(makeHttpsRequest(options)).rejects.toThrow(
      "Error making HTTPS request, response statusCode: '404', host:'example.com', path:'/test'"
    )
  })

  it('should reject when JSON parsing fails', async () => {
    const options = { host: 'example.com', path: '/test' }

    const requestPromise = makeHttpsRequest(options)

    process.nextTick(() => {
      mockResponse.emit('data', 'invalid json')
      mockResponse.emit('end')
    })

    await expect(requestPromise).rejects.toThrow('Error parsing JSON response:')
  })

  it('should reject when response emits error', async () => {
    const options = { host: 'example.com', path: '/test' }
    const errorMessage = 'Connection failed'

    const requestPromise = makeHttpsRequest(options)

    process.nextTick(() => {
      mockResponse.emit('error', new Error(errorMessage))
    })

    await expect(requestPromise).rejects.toThrow(
      `Request error: ${errorMessage}`
    )
  })

  it('should handle non-Error objects in response error', async () => {
    const options = { host: 'example.com', path: '/test' }
    const errorObj = { code: 'ECONNRESET' }

    const requestPromise = makeHttpsRequest(options)

    process.nextTick(() => {
      mockResponse.emit('error', errorObj)
    })

    await expect(requestPromise).rejects.toThrow(
      `Request error: ${JSON.stringify(errorObj)}`
    )
  })
})
