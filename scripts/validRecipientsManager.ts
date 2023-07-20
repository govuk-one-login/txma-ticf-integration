import { program } from 'commander'
import { addEmailRecipient } from './validRecipientsManagement/addEmailRecipient'
import { listCurrentEmailRecipients } from './validRecipientsManagement/listCurrentEmailRecipients'
import { removeEmailRecipient } from './validRecipientsManagement/removeEmailRecipient'

process.env.AWS_REGION = 'eu-west-2'

program
  .option('--addEmail <email>', 'Email to add')
  .option('--removeEmail <email>', 'Email to remove')
  .option('--showCurrent')
  .option('--env <env>', 'Environment name')

program.parse(process.argv)

const options = program.opts()

const emailToAdd: string = options.addEmail
const emailToRemove: string = options.removeEmail
const showCurrentList: boolean = options.showCurrent

const environment = options.env

if (!environment) {
  console.error(
    'No environment specified with the --env parameter, should be one of dev, build, staging, production, integration'
  )
} else if (showCurrentList) {
  listCurrentEmailRecipients(environment)
    .then((list) => console.log('Current recipient list', list))
    .catch((err) => console.error(err))
} else if (!emailToAdd && !emailToRemove) {
  console.error(
    'No email to add or remove specified with the --addEmail or --removeEmail parameter'
  )
} else if (emailToAdd) {
  addEmailRecipient(emailToAdd.trim(), environment)
    .then(() => console.log('Done'))
    .catch((err) => console.error(err))
} else if (emailToRemove) {
  removeEmailRecipient(emailToRemove.trim(), environment)
    .then(() => console.log('Done'))
    .catch((err) => console.error(err))
}
