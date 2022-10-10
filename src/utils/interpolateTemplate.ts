interface MessagesInterface {
  name: string
  message: string
  replacements?: {
    [key: string]: string
  }
}

interface AdditionsInterface {
  [key: string]: string
}

export const interpolateTemplate = (
  key: string,
  messages: MessagesInterface[],
  additions: AdditionsInterface = {}
) => {
  if (!messages) {
    throw new Error(`Messages data is not included`)
  }

  const messageObj = messages.find((element) => element.name === key)

  if (!messageObj) {
    throw new Error(`No message object returned for '${key}'`)
  }

  let { message } = messageObj

  const allReplacements = (messageObj.replacements = {
    ...messageObj.replacements,
    ...additions
  })

  for (const prop in allReplacements) {
    message = message.replace(`{${prop}}`, allReplacements[prop])
  }

  return message
}
