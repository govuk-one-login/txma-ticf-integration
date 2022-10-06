export interface ContinueDataTransferParams {
  zendeskId: string
}

export const isContinueDataTransferParams = (
  arg: unknown
): arg is ContinueDataTransferParams => {
  const test = arg as ContinueDataTransferParams
  return typeof test?.zendeskId === 'string'
}
