import { loggingCopy } from '../../constants/loggingCopy'
import { zendeskCopy } from '../../constants/zendeskCopy'
import { startGlacierRestore } from '../../sharedServices/bulkJobs/startGlacierRestore'
import { checkS3BucketData } from '../../sharedServices/s3/checkS3BucketData'
import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
import { DataRequestParams } from '../../types/dataRequestParams'
import { interpolateTemplate } from '../../utils/interpolateTemplate'

export const initiateDataTransfer = async (
  dataRequestParams: DataRequestParams
) => {
  const bucketData = await checkS3BucketData(dataRequestParams)
  if (!bucketData.dataAvailable) {
    console.log(interpolateTemplate('noDataFound', loggingCopy))
    await updateZendeskTicketById(
      dataRequestParams.zendeskId,
      interpolateTemplate('bucketDataUnavailable', zendeskCopy),
      'closed'
    )
    return
  }

  if (bucketData.glacierTierLocationsToCopy?.length) {
    console.log(interpolateTemplate('foundGlacierLocations', loggingCopy))
    await startGlacierRestore(
      bucketData.glacierTierLocationsToCopy,
      dataRequestParams.zendeskId
    )
  }

  // TODO: add code here to initiate batch copy jobs
  // 1. If there is data available but nothing to copy - trigger the athena job immediately
  // 2. If there is data available and standard tier data to copy - trigger batch copy job
  // 3. If there is data available and glacier tier data to restore - trigger glacier restore job
  // 4. If both points 2 and 3, add logic around partial copy - Both S3 jobs need to finish before triggering next lambda
}
