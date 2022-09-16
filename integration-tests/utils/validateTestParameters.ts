const message = ' is not set. Please check your test environment file.'

const getEndUsername = () => {
  if (process.env.ZENDESK_END_USERNAME) {
    return process.env.ZENDESK_END_USERNAME
  } else {
    throw new Error(`process.env.ZENDESK_END_USERNAME ${message}`)
  }
}

const getAgentUsername = () => {
  if (process.env.ZENDESK_AGENT_USERNAME) {
    return process.env.ZENDESK_AGENT_USERNAME
  } else {
    throw new Error(`process.env.ZENDESK_AGENT_USERNAME ${message}`)
  }
}

const getZendeskBaseURL = () => {
  if (process.env.ZENDESK_BASE_URL) {
    return process.env.ZENDESK_BASE_URL
  } else {
    throw new Error(`process.env.ZENDESK_BASE_URL ${message}`)
  }
}

const getZendeskAPIToken = () => {
  if (process.env.ZENDESK_TEST_API_TOKEN) {
    return process.env.ZENDESK_TEST_API_TOKEN
  } else {
    throw new Error(`process.env.ZENDESK_TEST_API_TOKEN ${message}`)
  }
}

export {
  getEndUsername,
  getAgentUsername,
  getZendeskBaseURL,
  getZendeskAPIToken
}
