export interface NotifyError {
  response: {
    data: {
      errors: string[]
    }
  }
}
