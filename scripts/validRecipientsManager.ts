import { readS3DataToString } from '../src/sharedServices/s3/readS3DataToString'
import { program } from 'commander'
import { putS3Object } from '../src/sharedServices/s3/putS3Object'
process.env.AWS_REGION = 'eu-west-2'

const validRecipientBucketName = (environment: string) =>
  `txma-data-analysis-${environment}-email-recipients`

const readCurrentRecipientData = async (
  environment: string
): Promise<string[]> => {
  const rawList = await readS3DataToString(
    validRecipientBucketName(environment),
    'valid-email-recipients.txt'
  )
  return rawList.split('\n')
}

const convertListToLinebreakDelimitedString = (recipientList: string[]) =>
  recipientList.reduce((a, b) => `${a}\n${b}`)

const writeRecipientListToBucket = async (
  recipientList: string[],
  environment: string
) => {
  await putS3Object(
    validRecipientBucketName(environment),
    'valid-email-recipients.txt',
    Buffer.from(convertListToLinebreakDelimitedString(recipientList))
  )
}

const addNewEmailReceipient = async (email: string, environment: string) => {
  const currentRecipientList = await readCurrentRecipientData(environment)
  if (currentRecipientList.includes(email)) {
    console.log(`Recipient '${email}' is already in list, so nothing to add`)
    return
  }

  const newRecipientList = [...currentRecipientList, email]
  console.log(`Writing new recipient ${email} to recipient list`)
  await writeRecipientListToBucket(newRecipientList, environment)
  console.log(`Finished writing '${email}' to recipient list`)
}

const removeEmailRecipient = async (email: string, environment: string) => {
  const currentRecipientList = await readCurrentRecipientData(environment)
  if (!currentRecipientList.includes(email)) {
    console.log(`Recipient '${email}' is not in list, so nothing to remove`)
    return
  }
  const newRecipientList = currentRecipientList.filter(
    (recipientEmail) => recipientEmail != email
  )
  console.log(`Writing updated recipient list with '${email}' removed`)
  await writeRecipientListToBucket(newRecipientList, environment)
  console.log(`Finished writing updated recipient list with '${email}' removed`)
}

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
  readCurrentRecipientData(environment).then((list) =>
    console.log(
      'Current recipient list',
      convertListToLinebreakDelimitedString(list)
    )
  )
} else if (!emailToAdd && !emailToRemove) {
  console.error(
    'No email to add or remove specified with the --addEmail or --removeEmail parameter'
  )
} else if (emailToAdd) {
  addNewEmailReceipient(emailToAdd.trim(), environment)
    .then(() => console.log('Done'))
    .catch((err) => console.error(err))
} else if (emailToRemove) {
  removeEmailRecipient(emailToRemove.trim(), environment)
    .then(() => console.log('Done'))
    .catch((err) => console.error(err))
}
