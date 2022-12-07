export interface CustomAxiosResponse {
  status: number
  statusText: string
  config: {
    method: string
    url: string
    data: string
  }
  data: {
    notifications?: NotificationObject[]
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
