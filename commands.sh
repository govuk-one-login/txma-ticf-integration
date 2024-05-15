# q1 jan-01, feb-02, mar-03
# q2 apr-04, may-05, june-06
# q3 jul-07, aug-08 sep-09
# q4 oct-10, nov,-11 dev-12



# yarn cli retrieve-audit-data TT21546q22022 --daterange "2022/06/23-2022/06/30" b9723edf-df09-4c58-9fc8-d7097333b307
# yarn cli retrieve-audit-data TT21546q32022 --daterange "2022/07/01-2022/09/30" 48e10fce-65ab-4779-a8ac-ab8e4e20ecbf
# yarn cli retrieve-audit-data TT21546q42022 --daterange "2022/10/01-2022/12/31" 666060c7-e03d-4116-a513-27efb63a47c2

# yarn cli retrieve-audit-data TT21546q12023 --daterange "2023/01/01-2023/03/31" 2ad624ba-2824-4c40-8581-f0c2ede4c8db
# yarn cli retrieve-audit-data TT21546q22023 --daterange "2023/04/01-2023/06/30" c6663080-f473-4b67-9352-6adb7063dcdd
# yarn cli retrieve-audit-data TT21546q32023 --daterange "2023/07/01-2023/09/30" fbd93da6-7f04-4e90-bbbe-6c67b92f7316
# yarn cli retrieve-audit-data TT21546q42023 --daterange "2023/10/01-2023/12/31" 615d57d4-3e96-4cc3-aeaa-3921e3857305

# yarn cli retrieve-audit-data TT21546q12024 --daterange "2024/01/01-2024/03/31" 7b5efaff-9349-42a5-8aeb-85666992bd21
yarn cli retrieve-audit-data TT21546Apr2022 --daterange "2024/04/01-2024/04/12"

yarn cli inspect-data-retrieval TT21659Dec22 --daterange "2023/12/31-2023/12/31"
yarn cli inspect-data-retrieval TT21659JanFeb24 --daterange "2023/12/31-2023/12/31"


export AUDIT_BUCKET_NAME="audit-production-message-batch"
export ANALYSIS_BUCKET_NAME="txma-ticf-integration-production-analysis-bucket"
export PERMANENT_AUDIT_BUCKET_NAME="audit-production-permanent-message-batch"
export FEATURE_DECRYPT_DATA="true"



# done
aws s3api head-object --bucket "audit-production-permanent-message-batch" --key "firehose/2024/01/14/23/audit-message-batch-36-2024-01-14-23-32-12-1d5d328f-e02e-4215-a7e2-1694b63b2251.gz"

# not done
aws s3api head-object --bucket "audit-production-permanent-message-batch" --key "firehose/2024/01/14/23/audit-message-batch-36-2024-01-14-23-46-32-de4aabc5-780d-471f-8b5c-e52832408ce0.gz"





yarn cli send-query-results 'production' '4130534c-ea82-400e-87b8-6ccc036b2e2d' '5816383' 'Luke Darby' 'luke.darby@digital.cabinet-office.gov.uk'                                                                        
