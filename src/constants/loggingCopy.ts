export const loggingCopy = [
  {
    name: 'noDataFound',
    message: 'No data found for period, closing Zendesk ticket'
  },
  {
    name: 'foundGlacierLocations',
    message: 'Found glacier tier locations to restore'
  },
  {
    name: 'invalidWebhookSignature',
    message: 'Request received with invalid webhook signature'
  },
  {
    name: 'transferQueueMessageWithId',
    message: 'Sent data transfer queue message with id {messageId}'
  },
  {
    name: 'requestInvalid',
    message: 'Zendesk request was invalid'
  },
  {
    name: 'zendeskNoInfo',
    message: 'No Zendesk info available. Cannot update ticket.'
  },
  {
    name: 'zendeskNoTicketId',
    message: 'No Zendesk ticket ID present. Cannot update ticket.'
  },
  {
    name: 'zendeskTicketIdFound',
    message: 'Zendesk ticket with matching id found'
  },
  {
    name: 'zendeskSuccessful',
    message: 'Zendesk ticket update successful.'
  },
  {
    name: 'zendeskFailed',
    message: 'Zendesk ticket update failed.'
  },
  {
    name: 'zendeskUserFound',
    message: 'Zendesk user with matching id found'
  },
  {
    name: 'zendeskUserNotFound',
    message: 'The returned data was not a Zendesk user'
  },
  {
    name: 'requestMatchesZendeskTickets',
    message: 'Matching received request with existing Zendesk Tickets'
  },
  {
    name: 'requestDoesntMatcheZendeskTickets',
    message:
      'Request does not match values on Ticket, the following parameters do not match:'
  },
  {
    name: 'requestMatchesExistingZendeskTickets',
    message: 'Request details match existing Zendesk ticket'
  },
  {
    name: 'requestNotSentToNotify',
    message: 'Could not send a request to Notify: '
  },
  {
    name: 'ticketNotUpdated',
    message: 'Could not update Zendesk ticket: '
  },
  {
    name: 'dataAvailableQueuingQuery',
    message: 'All data available, queuing Athena query'
  },
  {
    name: 'queuingMessageLongPoll',
    message: 'Batch job started, queuing message for long poll'
  }
]
