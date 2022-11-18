import axios from 'axios'
import { authoriseAs } from './authoriseAs'
import {
  ZENDESK_AGENT_EMAIL,
  ZENDESK_BASE_URL,
  ZENDESK_TICKETS_ENDPOINT
} from '../../constants/zendeskParameters'
import { ZendeskComment } from '../../types/zendeskComment'

export const listZendeskTicketComments = async (
  ticketId: string
): Promise<ZendeskComment[]> => {
  try {
    const response = await axios({
      url: `${ZENDESK_BASE_URL}${ZENDESK_TICKETS_ENDPOINT}/${ticketId}/comments`,
      method: 'GET',
      headers: {
        Authorization: authoriseAs(ZENDESK_AGENT_EMAIL),
        Accept: 'application/json'
      }
    })

    return response.data.comments
  } catch (error) {
    console.log(error)
    throw 'Error getting Zendesk ticket comments'
  }
}

export const assertZendeskCommentPresent = async (
  ticketId: string,
  commentBody: string
) => {
  const ticketComments = await listZendeskTicketComments(ticketId)
  const commentPresent = ticketComments.some((comment) =>
    comment.body.includes(commentBody)
  )
  expect(commentPresent).toEqual(true)
}
