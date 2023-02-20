import { base64Encode } from './httpsRequestUtils'

describe('#base64Encode', () => {
  it('returns the correctly encoded value along with the "Basic " prefix', () => {
    const value = 'test.user@example.email.com/token:aBcDe12345F6g7H8i9'
    const encodedValue =
      'Basic ' +
      'dGVzdC51c2VyQGV4YW1wbGUuZW1haWwuY29tL3Rva2VuOmFCY0RlMTIzNDVGNmc3SDhpOQ=='
    expect(base64Encode(value)).toEqual(encodedValue)
  })
})
