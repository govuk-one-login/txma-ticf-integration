import { handler } from './helloWorld'

test('returns 200 response', async () => {
  const expectedResult = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'hello world'
    })
  }

  const result = await handler()

  expect(result).toEqual(expectedResult)
})
