import axios from 'axios'
import parse from 'node-html-parser'
import { getEnv } from './helpers'

export const getSecureDownloadPageHTML = async (
  downloadHash: string
): Promise<string> => {
  try {
    const response = await axios({
      url: `${getEnv('QUERY_RESULTS_SECURE_DOWNLOAD_URL')}/${downloadHash}`,
      method: 'POST'
    })
    return response.data
  } catch (error) {
    console.error(error)
    throw 'Could not load secure download page'
  }
}

export const retrieveS3LinkFromHtml = (htmlBody: string): string => {
  const htmlRoot = parse(htmlBody)
  const metaTag = htmlRoot.querySelector('meta[http-equiv="refresh"]')
  const contentAttribute = metaTag?.attributes['content'] as string
  expect(contentAttribute).toBeDefined()

  const urlMatch = contentAttribute.match(/url=(.*)/)
  const url = urlMatch ? urlMatch[1] : undefined
  expect(url).toBeDefined()
  console.log('S3 URL: ' + url)
  return url as string
}

export const downloadResultsCSVFromLink = async (
  s3Link: string
): Promise<string> => {
  try {
    const response = await axios({ url: s3Link, method: 'GET' })
    return response.data
  } catch (error) {
    console.log(error)
    throw 'Error downloading results csv from S3 link'
  }
}
