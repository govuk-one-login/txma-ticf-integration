// import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'
// // import { AthenaClient } from '@aws-sdk/client-athena';
// import { initiateAthenaQuery } from '../services/initiateAthenaQuery'
// // import { updateZendeskTicket } from '../services/updateZendeskTicket'
// // import { validateZendeskRequest } from '../services/validateZendeskRequest'
// // import { DataRequestParams } from '../types/dataRequestParams'
// // import { ValidatedDataRequestParamsResult } from '../types/validatedDataRequestParamsResult'

// const client = new AthenaClient({region: "eu-west-2"})

// export const handler = async (
//   event: APIGatewayProxyEvent
// ): Promise<APIGatewayProxyResult> => {
//   console.log('received S3 batch job confirmation', JSON.stringify(event, null, 2))
//   // const validatedZendeskRequest = validateZendeskRequest(event.body)
//   // if (!validatedZendeskRequest.isValid) {
//   //   return handleInvalidRequest(event.body, validatedZendeskRequest)
//   // }
//   const athenaQueryInitiateResult = await initiateAthenaQuery(

//   )
//   return {

//     })
//   }
// }

// const handleInvalidRequest = async (
//   requestBody: string | null,
//   validatedZendeskRequest: ValidatedDataRequestParamsResult
// ) => {
//   const validationMessage =
//     validatedZendeskRequest.validationMessage ?? 'Ticket parameters invalid'
//   await updateZendeskTicket(requestBody, validationMessage)
//   return {
//     statusCode: 400,
//     body: JSON.stringify({
//       message: validationMessage
//     })
//   }
// }
