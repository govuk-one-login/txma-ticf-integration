export { logger, initialiseLogger } from '@govuk-one-login/dpt-logging'
import { logger } from '@govuk-one-login/dpt-logging'

export const appendZendeskIdToLogger = (zendeskId: string) => {
  logger.appendKeys({ zendeskId })
}
