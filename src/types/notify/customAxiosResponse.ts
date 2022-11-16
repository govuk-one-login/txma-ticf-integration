// LEGACY FILE - CODE HAS MOVED TO RESULTS_DELIVERY REPO

export interface CustomAxiosResponse {
  status: number
  statusText: string
  config: {
    method: string
    url: string
    data: string
  }
  data:
    | {
        notifications?: NotificationObject[]
      }
    | NotificationObject
    // below only needed for sendEmail which is now redundant here
    | {
        content: {
          subject: string
        }
      }
}

export interface NotificationObject {
  id: string
  body?: string
  subject?: string
  reference: string
  email_address: string
  status:
    | 'sending'
    | 'delivered'
    | 'permanent-failure'
    | 'temporary-failure'
    | 'technical-failure'
  template: {
    version: number
    id: number
    uri: string
  }
  created_by_name: string
  created_at: string
  sent_at: string
}
