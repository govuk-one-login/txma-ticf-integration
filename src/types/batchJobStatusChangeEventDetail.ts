export interface BatchJobStatusChangeEventDetail {
  serviceEventDetails: {
    jobId: string
    status: string
  }
}
