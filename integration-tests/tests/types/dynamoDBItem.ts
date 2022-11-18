export type DynamoDBItem = {
  ticket: ItemDetails
}

export type ItemDetails = {
  fields: Field[]
}

export type Field = {
  id: number
  value: string | null | string[]
}
