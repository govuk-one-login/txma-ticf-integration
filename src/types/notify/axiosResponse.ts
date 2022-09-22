export interface CustomAxiosResponse {
  status: number
  statusText: string
  config: {
    method: string
    url: string
    data: string
  }
  data: {
    content: {
      subject: string
    }
  }
}
