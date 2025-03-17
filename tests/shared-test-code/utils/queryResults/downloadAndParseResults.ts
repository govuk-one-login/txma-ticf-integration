import axios, { isAxiosError } from 'axios'
import parse from 'node-html-parser'
import * as CSV from 'csv-string'

export async function downloadResultsFileAndParseData(
  secureDownloadPageUrl: string
): Promise<Record<string, string>[]> {
  const secureDownloadPageHTML = await getSecureDownloadPageHTML(
    secureDownloadPageUrl
  )

  const resultsFileS3Link = retrieveS3LinkFromHtml(secureDownloadPageHTML)
  expect(resultsFileS3Link.startsWith('https')).toBe(true)

  const csvData = await downloadResultsCSVFromLink(resultsFileS3Link)
  const csvRows = CSV.parse(csvData, { output: 'objects' })

  return csvRows
}

const getSecureDownloadPageHTML = async (
  secureDownloadPageUrl: string
): Promise<string> => {
  try {
    const response = await axios({
      url: secureDownloadPageUrl,
      method: 'POST'
    })
    return response.data
  } catch (error) {
    if (isAxiosError(error)) {
      console.error(error.response?.status)
      console.error(error.response?.statusText)
      console.error(error.response?.data)
    } else {
      console.error(error)
    }
    throw 'Could not load secure download page'
  }
}

const retrieveS3LinkFromHtml = (htmlBody: string): string => {
  const htmlRoot = parse(htmlBody)
  const metaTag = htmlRoot.querySelector('meta[http-equiv="refresh"]')
  const contentAttribute = metaTag?.attributes['content'] as string
  expect(contentAttribute).toBeDefined()

  const urlMatch = contentAttribute.match(/url=(.*)/)
  const url = urlMatch ? urlMatch[1] : undefined
  expect(url).toBeDefined()

  return url as string
}

const downloadResultsCSVFromLink = async (s3Link: string): Promise<string> => {
  try {
    const response = await axios({ url: s3Link, method: 'GET' })
    return response.data
  } catch (error) {
    console.log(error)
    throw 'Error downloading results csv from S3 link'
  }
}
