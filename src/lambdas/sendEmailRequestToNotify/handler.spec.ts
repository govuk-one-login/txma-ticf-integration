// import {
//   TEST_NOTIFY_EMAIL,
//   TEST_NOTIFY_NAME,
//   TEST_SECURE_DOWNLOAD_URL,
//   ZENDESK_TICKET_ID
// } from '../../utils/tests/testConstants'
// import { handler } from './handler'
// import { updateZendeskTicketById } from '../../sharedServices/zendesk/updateZendeskTicket'
// import { sendEmailToNotify } from './sendEmailToNotify'
// import { constructSqsEvent } from '../../utils/tests/events/sqsEvent'

// jest.mock('./sendEmailToNotify', () => ({
//   sendEmailToNotify: jest.fn()
// }))
// jest.mock('../../sharedServices/zendesk/updateZendeskTicket', () => ({
//   updateZendeskTicketById: jest.fn()
// }))
// const mockUpdateZendeskTicketById = updateZendeskTicketById as jest.Mock
// const mockSendEmailToNotify = sendEmailToNotify as jest.Mock
// const givenUnsuccessfulSendEmailToNotify = () => {
//   mockSendEmailToNotify.mockImplementation(() => {
//     throw new Error('A Notify related error')
//   })
// }
// const givenUnsuccessfulUpdateZendeskTicket = () => {
//   mockUpdateZendeskTicketById.mockImplementation(() => {
//     throw new Error('An updateZendeskTicket related error')
//   })
// }
// const validEventBody = `{
//       "email": "${TEST_NOTIFY_EMAIL}",
//       "firstName": "${TEST_NOTIFY_NAME}",
//       "zendeskId": "${ZENDESK_TICKET_ID}",
//       "secureDownloadUrl": "${TEST_SECURE_DOWNLOAD_URL}"
//     }`
// const callHandlerWithBody = async (customBody: string) => {
//   await handler(constructSqsEvent(customBody))
// }

describe('sendEmail handlee', () => {
  it('should have aplaceholder', () => {
    expect(true).toBeTrue
  })

  // it('should create a link with the correct details', () => {
  //   expect(createSecureDownloadLink(TEST_DOWNLOAD_HASH)).toEqual(
  //     `${TEST_SECURE_DOWNLOAD_WEBSITE_BASE_PATH}/${TEST_DOWNLOAD_HASH}`
  //   )
  // })
})
// describe('initiate sendEmailRequest handler', () => {
//   beforeEach(() => {
//     jest.spyOn(global.console, 'error')
//   })
//   afterEach(() => {
//     jest.clearAllMocks()
//   })

//   it('creates a NotifyClient and calls sendEmail with correct parameters', async () => {
//     await callHandlerWithBody(validEventBody)

//     expect(mockSendEmailToNotify).toHaveBeenCalledWith({
//       email: TEST_NOTIFY_EMAIL,
//       firstName: TEST_NOTIFY_NAME,
//       zendeskId: ZENDESK_TICKET_ID,
//       secureDownloadUrl: TEST_SECURE_DOWNLOAD_URL
//     })
//     expect(mockUpdateZendeskTicketById).toHaveBeenCalledTimes(1)
//     expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
//       ZENDESK_TICKET_ID,
//       'A link to your results has been sent to you.',
//       'closed'
//     )
//   })

//   it('throws an error when no event records are in the SQSEvent object', async () => {
//     await expect(handler({ Records: [] })).rejects.toThrow(
//       'No records found in event'
//     )
//   })

//   it('throws an error when no event body is present', async () => {
//     const invalidEventBody = ''

//     await expect(callHandlerWithBody(invalidEventBody)).rejects.toThrow(
//       'Could not find event body. An email has not been sent'
//     )
//   })
//   it('throws an error when zendeskId is missing from the event body', async () => {
//     const eventBodyParams = JSON.stringify({
//       email: TEST_NOTIFY_EMAIL,
//       firstName: TEST_NOTIFY_NAME,
//       secureDownloadUrl: TEST_SECURE_DOWNLOAD_URL
//     })

//     await expect(callHandlerWithBody(eventBodyParams)).rejects.toThrow(
//       'Zendesk ticket ID missing from event body'
//     )
//   })
//   it('throws an error when zendeskId is an empty string', async () => {
//     const eventBodyParams = JSON.stringify({
//       email: TEST_NOTIFY_EMAIL,
//       firstName: TEST_NOTIFY_NAME,
//       secureDownloadUrl: TEST_SECURE_DOWNLOAD_URL,
//       zendeskId: ''
//     })

//     await expect(callHandlerWithBody(eventBodyParams)).rejects.toThrow(
//       'Zendesk ticket ID missing from event body'
//     )
//   })
//   it.each(['firstName', 'email', 'secureDownloadUrl'])(
//     'updates Zendesk ticket, and throws an error when %p is missing from the event body',
//     async (missingPropertyName: string) => {
//       const eventBodyParams = {
//         email: TEST_NOTIFY_EMAIL,
//         firstName: TEST_NOTIFY_NAME,
//         secureDownloadUrl: TEST_SECURE_DOWNLOAD_URL,
//         zendeskId: ZENDESK_TICKET_ID
//       } as { [key: string]: string }
//       delete eventBodyParams[missingPropertyName]

//       await expect(
//         callHandlerWithBody(JSON.stringify(eventBodyParams))
//       ).rejects.toThrow('Required details were not all present in event body')
//       expect(mockUpdateZendeskTicketById).toHaveBeenCalledTimes(1)
//       expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
//         ZENDESK_TICKET_ID,
//         'Your results could not be emailed.',
//         'closed'
//       )
//     }
//   )
//   it.each(['firstName', 'email', 'secureDownloadUrl'])(
//     'updates Zendesk ticket, and throws an error when %p is an empty string',
//     async (emptyStringPropertyName: string) => {
//       const eventBodyParams = {
//         email: TEST_NOTIFY_EMAIL,
//         firstName: TEST_NOTIFY_NAME,
//         secureDownloadUrl: TEST_SECURE_DOWNLOAD_URL,
//         zendeskId: ZENDESK_TICKET_ID
//       } as { [key: string]: string }
//       eventBodyParams[emptyStringPropertyName] = ''

//       await expect(
//         callHandlerWithBody(JSON.stringify(eventBodyParams))
//       ).rejects.toThrow('Required details were not all present in event body')
//       expect(mockUpdateZendeskTicketById).toHaveBeenCalledTimes(1)
//       expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
//         ZENDESK_TICKET_ID,
//         'Your results could not be emailed.',
//         'closed'
//       )
//     }
//   )
//   it('given a valid event body, when sendEmailToNotify fails, logs an error and calls closeZendeskTicket', async () => {
//     givenUnsuccessfulSendEmailToNotify()

//     await callHandlerWithBody(validEventBody)

//     expect(console.error).toHaveBeenCalledWith(
//       'Could not send a request to Notify: ',
//       JSON.stringify(Error('A Notify related error'))
//     )
//     expect(mockUpdateZendeskTicketById).toHaveBeenCalledTimes(1)
//     expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
//       ZENDESK_TICKET_ID,
//       'Your results could not be emailed.',
//       'closed'
//     )
//   })
//   it('given valid event body and Notify request was successful, it logs an error when updateZendeskTicketById fails', async () => {
//     givenUnsuccessfulUpdateZendeskTicket()

//     await callHandlerWithBody(validEventBody)
//     expect(mockSendEmailToNotify).toHaveBeenCalledWith({
//       email: TEST_NOTIFY_EMAIL,
//       firstName: TEST_NOTIFY_NAME,
//       zendeskId: ZENDESK_TICKET_ID,
//       secureDownloadUrl: TEST_SECURE_DOWNLOAD_URL
//     })
//     expect(mockUpdateZendeskTicketById).toHaveBeenCalledTimes(1)
//     expect(mockUpdateZendeskTicketById).toHaveBeenCalledWith(
//       ZENDESK_TICKET_ID,
//       'Your results could not be emailed.',
//       'closed'
//     )
//     expect(console.error).toHaveBeenCalledWith(
//       'Could not update Zendesk ticket: ',
//       Error('An updateZendeskTicket related error')
//     )
//   })
//   it('given a valid event body, when sendEmailToNotify and updateZendeskTicketById fails, both errors are logged', async () => {
//     givenUnsuccessfulSendEmailToNotify()
//     givenUnsuccessfulUpdateZendeskTicket()

//     await callHandlerWithBody(validEventBody)

//     expect(console.error).toHaveBeenCalledTimes(2)
//     expect(console.error).toHaveBeenNthCalledWith(
//       1,
//       'Could not send a request to Notify: ',
//       JSON.stringify(Error('A Notify related error'))
//     )
//     expect(console.error).toHaveBeenLastCalledWith(
//       'Could not update Zendesk ticket: ',
//       Error('An updateZendeskTicket related error')
//     )
//   })
// })
