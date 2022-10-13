import { approveZendeskRequest } from '../utils/approveZendeskRequest'
import { createZendeskRequest } from '../utils/raiseZendeskRequest'
import { populateTableWithRequestDetails } from '../utils/dynamoDB'

describe('Generate SQL for Athena after request is validated', () => {
  jest.setTimeout(30000)

  it('Retrieval Completion message in Audit Queue should trigger Athena SQL lambda', async () => {
    // SETUP:
    //1.) create and approve zendesk ticket
    const ticketID = await createZendeskRequest(true)
    await approveZendeskRequest(ticketID)

    //2.) Put Zendesk details in Dynamodb
    await populateTableWithRequestDetails(ticketID)

    // ACT:
    // Put message in queue
    // Validate DB is being queried or successfully queried

    // ASSERT:
    // Validate SQL is generated
    // Validate SQL contains relevant zendesk parameters
    expect(1).toEqual(1)
  })

  /*it('Athena SQL Lambda should error if ticket details are not in Dynamodb', () => {
    expect(1).toEqual(1)
  })*/

  /*it('Athena SQL Lambda should error if ticket details does not contain dataPaths', () => {})*/
})
