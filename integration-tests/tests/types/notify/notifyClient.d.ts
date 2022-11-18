/* eslint-disable no-unused-vars */

declare module 'notifications-node-client' {
  interface Options {
    personalisation: import('./personalisationOptions')
    reference: string
  }
  export class NotifyClient {
    constructor(apiKey: string)
    getNotifications(
      status?: string,
      notificationType?: string,
      reference?: string,
      olderThan?: string
    ): import('./customAxiosResponse')
  }
}
