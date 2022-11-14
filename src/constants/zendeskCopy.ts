export const zendeskCopy = [
  {
    name: 'ticketClosed',
    message:
      'Your ticket has been closed because some fields were invalid. Here is the list of what was wrong: {validationMessage}',
    replacements: {
      validationMessage: 'Incorrect ticket ID'
    }
  },
  {
    name: 'bucketDataUnavailable',
    message:
      'Your ticket has been closed because no data was available for the requested dates'
  },
  {
    name: 'ticketClosedMismatchWithState',
    message:
      'Your ticket has been closed because a request was received for this ticket with details that do not match its current state.'
  },
  {
    name: 'responseMessageWhenParamsMismatch',
    message: 'Request parameters do not match a Zendesk Ticket'
  },
  {
    name: 'invalidSignature',
    message: 'Invalid request source'
  },
  {
    name: 'throwNotZendeskTicket',
    message: 'The returned data was not a Zendesk ticket'
  },
  {
    name: 'transferInitiated',
    message: 'data transfer initiated'
  },
  {
    name: 'ticketNotFound',
    message: 'Zendesk ticket not found'
  },
  {
    name: 'zendeskTicketIdMissing',
    message: 'Zendesk ticket ID missing from event body'
  },
  {
    name: 'commentCopyReferenceMissing',
    message: 'Comment copy reference missing from event body'
  },
  {
    name: 'missingEventBody',
    message: 'Could not find event body'
  }
]
