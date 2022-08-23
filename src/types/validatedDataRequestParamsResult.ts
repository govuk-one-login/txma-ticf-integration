import { DataRequestParams } from './dataRequestParams'

export interface ValidatedDataRequestParamsResult {
  dataRequestParams: DataRequestParams
  isValid: boolean
  validationMessage?: string
}
