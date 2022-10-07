export interface DDbQueryObject {
  zendeskId?: {
    S: string
  }
  requestInfo?: {
    M: UnparsedDataRequestParams
  }
  checkGlacierStatusCount?: {
    N: string
  }
  checkCopyStatusCount?: {
    N: string
  }
}

export interface UnparsedDataRequestParams {
  zendeskId: {
    S: string
  }
  dataPaths: {
    L: {
      S: string
    }[]
  }
  dateFrom: {
    S: string
  }
  dateTo: {
    S: string
  }
  eventIds: {
    L: {
      S: string
    }[]
  }
  identifierType: {
    S: string
  }
  journeyIds: {
    L: {
      S: string
    }[]
  }
  piiTypes: {
    L: {
      S: string
    }[]
  }
  resultsEmail: {
    S: string
  }
  resultsName: {
    S: string
  }
  sessionIds: {
    L: {
      S: string
    }[]
  }
  userIds: {
    L: {
      S: string
    }[]
  }
}
