// LEGACY FILE - CODE HAS MOVED TO RESULTS_DELIVERY REPO
/* eslint-disable no-unused-vars */
declare module 'notifications-node-client' {
  interface Options {
    personalisation: import('./personalisationOptions')
    reference: string
  }
  export class NotifyClient {
    constructor(apiKey: string)
    sendEmail(
      templateId: string,
      emailAddress: string,
      options: Options
    ): import('./customAxiosResponse')
    getNotifications(
      status?: string,
      notificationType?: string,
      reference?: string,
      olderThan?: string
    ): import('./customAxiosResponse')
    getNotificationById(notificationId: string): import('./customAxiosResponse')
  }
}
