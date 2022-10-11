export interface ZendeskUserResult {
  user: ZendeskUser
}

export interface ZendeskUser {
  email: string
  name: string
}

export const isZendeskUserResult = (arg: unknown): arg is ZendeskUserResult => {
  const test = arg as ZendeskUserResult
  return (
    typeof test?.user.name === 'string' && typeof test?.user.email === 'string'
  )
}
