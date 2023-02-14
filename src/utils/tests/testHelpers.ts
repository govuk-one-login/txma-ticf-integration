import { Readable } from 'stream'

export const createDataStream = (testData: string) => {
  const dataStream = new Readable()
  dataStream.push(testData)
  dataStream.push(null)
  return dataStream
}
