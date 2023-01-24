import https from 'node:https'
import { logger } from '../logger'

export const makeHttpsRequest = async (
  options: https.RequestOptions,
  postData: Record<string, unknown> | undefined = undefined
) => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (response) => {
      logger.info('STATUS: ' + response.statusCode)
      if (!response || !response.statusCode)
        return reject(new Error('Response or statusCode undefined.'))
      if (response.statusCode < 200 || response.statusCode >= 300)
        return reject(new Error('statusCode = ' + response['statusCode']))

      response.setEncoding('utf-8')
      let chunks = ''

      response.on('data', (chunk) => {
        chunks += chunk
      })

      response.on('end', () => {
        try {
          chunks = chunks.length > 0 ? JSON.parse(chunks) : {}
        } catch (error) {
          reject(error)
        }
        resolve(chunks)
      })

      response.on('error', (error) => {
        reject(error)
      })
    })

    if (postData) req.write(JSON.stringify(postData))
    req.end()
  })
}

export const base64Encode = (input: string): string => {
  return 'Basic ' + Buffer.from(input).toString('base64')
}
