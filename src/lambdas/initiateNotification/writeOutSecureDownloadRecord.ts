export const writeOutSecureDownloadRecord = async (
  athenaQueryId: string,
  downloadHash: string
) => {
  // TODO: stop logging out the hash here, just doing it before we have real code for linting purposes
  console.log(
    `creating secure download for athena query id ${athenaQueryId} and download hash ${downloadHash}`
  )
}
