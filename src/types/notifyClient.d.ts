/* eslint-disable no-unused-vars */
interface Options {
  personalisation: {
    firstName: string
    zendeskId: string
    signedUrl: string
    reference: string
  }
}
declare module 'notifications-node-client' {
  export default class NotifyClient {
    constructor(apiKey: string)
    sendEmail(
      templateId: string,
      emailAddress: string,
      options: Options
    ): string
  }
}
