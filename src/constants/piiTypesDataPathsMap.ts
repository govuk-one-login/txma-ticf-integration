export const PII_TYPES_DATA_PATHS_MAP: { [key: string]: string } = {
  passport_number: 'restricted.passport[0].documentnumber',
  passport_expiry_date: 'restricted.passport[0].expirydate',
  drivers_license: 'restricted.drivingpermit',
  dob: 'restricted.birthdate[0].value',
  name: 'restricted.name',
  current_address: 'restricted.address',
  previous_address: 'restricted.address'
}
