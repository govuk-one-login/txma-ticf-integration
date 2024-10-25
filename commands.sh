# q1 jan-01, feb-02, mar-03
# q2 apr-04, may-05, june-06
# q3 jul-07, aug-08 sep-09
# q4 oct-10, nov,-11 dev-12

yarn cli retrieve-audit-data DPT655June2024 --daterange "2024/06/01-2024/06/30" Job ID c03dbc1a-2d12-4aa9-b6d0-c5248db77cdc
yarn cli retrieve-audit-data DPT655Dec2023 --daterange "2023/12/01-2023/12/31" Job ID 2cca535e-feaa-4613-90c3-1b7ac33ed3c0
yarn cli retrieve-audit-data DPT655Dec2022 --daterange "2022/12/01-2022/12/31" Job ID 96ad4477-245f-4125-bd68-f71c50524189

# yarn cli retrieve-audit-data TT21546q12024 --daterange "2024/01/01-2024/03/31" 7b5efaff-9349-42a5-8aeb-85666992bd21
# yarn cli retrieve-audit-data TT21546Apr2022 --daterange "2024/04/01-2024/04/12"

# yarn cli inspect-data-retrieval TT21659Dec22 --daterange "2023/12/31-2023/12/31"
# yarn cli inspect-data-retrieval TT21659JanFeb24 --daterange "2023/12/31-2023/12/31"

export AUDIT_BUCKET_NAME="audit-production-message-batch"
export ANALYSIS_BUCKET_NAME="txma-ticf-integration-production-analysis-bucket"
export PERMANENT_AUDIT_BUCKET_NAME="audit-production-permanent-message-batch"
export FEATURE_DECRYPT_DATA="true"

# done
aws s3api head-object --bucket "audit-production-permanent-message-batch" --key "firehose/2024/01/14/23/audit-message-batch-36-2024-01-14-23-32-12-1d5d328f-e02e-4215-a7e2-1694b63b2251.gz"

# not done
aws s3api head-object --bucket "audit-production-permanent-message-batch" --key "firehose/2024/01/14/23/audit-message-batch-36-2024-01-14-23-46-32-de4aabc5-780d-471f-8b5c-e52832408ce0.gz"

yarn cli send-query-results 'production' '4130534c-ea82-400e-87b8-6ccc036b2e2d' '5816383' 'Luke Darby' 'luke.darby@digital.cabinet-office.gov.uk'
