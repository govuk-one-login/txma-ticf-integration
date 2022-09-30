/* eslint-disable no-unused-vars */

declare module 'notifications-node-client' {
  interface Options {
    personalisation: import('./personalisationOptions')
  }
  export class NotifyClient {
    constructor(apiKey: string)
    sendEmail(
      templateId: string,
      emailAddress: string,
      options: Options
    ): import('./customAxiosResponse')
  }
}
