export const createManifestFileText = (
  sourceBucket: string,
  fileList: string[]
) =>
  fileList
    .map((file) => createManifestFileLine(sourceBucket, file))
    .join('\r\n')

const createManifestFileLine = (sourceBucket: string, fileKey: string) =>
  `${sourceBucket},${fileKey}`
