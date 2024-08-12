import https from 'node:https'

export const makeHttpsRequest = async (
  options: https.RequestOptions,
  postData: Record<string, unknown> | undefined = undefined
) => {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (response) => {
      if (!response?.statusCode)
        return reject(
          new Error(
            `Error making HTTPS request. Response or statusCode undefined. Host:'${options.host}', path:'${options.path}'.`
          )
        )
      if (response.statusCode < 200 || response.statusCode >= 300)
        return reject(
          new Error(
            `Error making HTTPS request, response statusCode: '${response['statusCode']}', host:'${options.host}', path:'${options.path}'`
          )
        )

      response.setEncoding('utf-8')
      let chunks = ''

      response.on('data', (chunk) => {
        chunks += chunk
      })

      response.on('end', () => {
        try {
          chunks = chunks.length > 0 ? JSON.parse(chunks) : {}
        } catch (error) {
          reject(
            new Error(
              `Error parsing JSON response: ${
                error instanceof Error ? error.message : String(error)
              }`
            )
          )
        }
        resolve(chunks)
      })

      response.on('error', (error) => {
        reject(
          new Error(
            `Request error: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        )
      })
    })

    if (postData) req.write(JSON.stringify(postData))
    req.end()
  })
}

export const base64Encode = (input: string): string => {
  return 'Basic ' + Buffer.from(input).toString('base64')
}
