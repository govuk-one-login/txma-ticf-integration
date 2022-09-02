import { TICKET_ID } from '../testConstants'

export const exampleEventBody = JSON.stringify({
  zendeskId: TICKET_ID,
  resultsEmail: 'test@email.com',
  dateFrom: '2022-08-17',
  dateTo: '2022-08-17',
  identifierType: 'session_id',
  sessionIds: '123',
  journeyIds: '456',
  eventIds: '789',
  piiTypes: 'passport_number',
  dataPaths: ''
})
