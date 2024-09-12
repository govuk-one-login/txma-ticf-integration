/* eslint-disable no-console */
import {
  HeadObjectCommand,
  RestoreObjectCommand,
  RestoreObjectCommandInput,
  S3Client
} from '@aws-sdk/client-s3'
import { RateLimit } from 'async-sema'

const rps = RateLimit(100)

const payload = {
  level: 'INFO',
  message: 'glacierTierLocationsToCopy',
  service: 'service_undefined',
  timestamp: '2024-07-19T10:38:03.619Z',
  glacierTierLocationsToCopy: [
    'firehose/2024/04/17/23/audit-message-batch-40-2024-04-17-23-52-50-28175147-5d3f-4b6f-ab12-173274aee908.gz',
    'firehose/2024/04/18/00/audit-message-batch-40-2024-04-18-00-07-04-7e50f8ca-f9e5-4f14-93d5-9e166e008c95.gz',
    'firehose/2024/04/18/00/audit-message-batch-40-2024-04-18-00-21-18-305822a9-c026-46da-8b23-fa2bf7e47258.gz',
    'firehose/2024/04/18/00/audit-message-batch-40-2024-04-18-00-35-31-452348d5-6ae3-477c-aeb4-e2790f1234f9.gz',
    'firehose/2024/04/18/00/audit-message-batch-40-2024-04-18-00-49-37-2c080a9f-0bc4-42a1-a94b-4490c40c0a81.gz',
    'firehose/2024/04/18/01/audit-message-batch-40-2024-04-18-01-03-45-c81a6ef7-1bbb-4692-b6a6-7281b42e5edc.gz',
    'firehose/2024/04/18/01/audit-message-batch-40-2024-04-18-01-18-02-5d03225f-21c2-4e5e-ac03-625c6dfa325c.gz',
    'firehose/2024/04/18/01/audit-message-batch-40-2024-04-18-01-32-19-e692c91e-7072-4cac-bf8c-e433e9aa606d.gz',
    'firehose/2024/04/18/01/audit-message-batch-40-2024-04-18-01-46-42-45fa6e90-e2d6-4899-b6e8-8fe9b2491521.gz',
    'firehose/2024/04/18/02/audit-message-batch-40-2024-04-18-02-01-05-22298c66-f1d6-41a9-bbe3-ae54132d0f49.gz',
    'firehose/2024/04/18/02/audit-message-batch-40-2024-04-18-02-15-29-773d0240-37ee-4d5d-bab7-07610c32b12a.gz',
    'firehose/2024/04/18/02/audit-message-batch-40-2024-04-18-02-29-50-8b3b9588-85d5-4cfc-8bc4-1afe623f21ed.gz',
    'firehose/2024/04/18/02/audit-message-batch-40-2024-04-18-02-44-22-32dd7151-265f-49f9-b507-7f0bf764daa5.gz',
    'firehose/2024/04/18/02/audit-message-batch-40-2024-04-18-02-58-38-465825f5-ea60-4326-b096-ec73537789c8.gz',
    'firehose/2024/04/18/03/audit-message-batch-40-2024-04-18-03-13-09-afb64be1-a2ea-4afd-9e35-6693862aa042.gz',
    'firehose/2024/04/18/03/audit-message-batch-40-2024-04-18-03-27-26-26562d5a-d62c-450b-bbb9-b070f4b0273a.gz',
    'firehose/2024/04/18/03/audit-message-batch-40-2024-04-18-03-41-47-698aa986-f0e4-46a1-9c3f-7b4d198e59d4.gz',
    'firehose/2024/04/18/03/audit-message-batch-40-2024-04-18-03-56-07-68fd9e0e-fcbd-4e6d-bfcb-9f8b3a5b81de.gz',
    'firehose/2024/04/18/04/audit-message-batch-40-2024-04-18-04-10-27-d47de606-1802-45fb-ab21-33461b66abbc.gz',
    'firehose/2024/04/18/04/audit-message-batch-40-2024-04-18-04-24-39-dc96309d-5848-46ed-8d1d-e46782f78d03.gz',
    'firehose/2024/04/18/04/audit-message-batch-40-2024-04-18-04-38-58-37e14064-b5c8-49e4-ac3a-281a1ade74f3.gz',
    'firehose/2024/04/18/04/audit-message-batch-40-2024-04-18-04-53-26-a94e6bc6-c096-4273-83a0-bd02ad9c0692.gz',
    'firehose/2024/04/18/05/audit-message-batch-40-2024-04-18-05-07-42-e7aca050-469b-41a4-abf0-6b4b9cf2d83b.gz',
    'firehose/2024/04/18/05/audit-message-batch-40-2024-04-18-05-21-51-098eaed1-b54f-45e2-af89-c39d79437948.gz',
    'firehose/2024/04/18/05/audit-message-batch-40-2024-04-18-05-36-05-bc0f74e0-e151-4ca2-8d14-fe7917f716c6.gz',
    'firehose/2024/04/18/05/audit-message-batch-40-2024-04-18-05-50-13-3d5084f3-f917-4f6f-b141-fec5e87dde69.gz',
    'firehose/2024/04/18/06/audit-message-batch-40-2024-04-18-06-04-24-a1957064-4f32-464c-8123-4e742314879e.gz',
    'firehose/2024/04/18/06/audit-message-batch-40-2024-04-18-06-18-31-3ec613d7-0466-4e08-8a76-5cb065b65413.gz',
    'firehose/2024/04/18/06/audit-message-batch-40-2024-04-18-06-32-41-7180f5fd-2fc8-40d6-aa36-c54b7136c60c.gz',
    'firehose/2024/04/18/06/audit-message-batch-40-2024-04-18-06-46-50-58a6accb-6d92-4801-896b-eea3835eeb6d.gz',
    'firehose/2024/04/18/07/audit-message-batch-40-2024-04-18-07-00-59-fc9d3af5-8f1d-47fd-a471-7dd9715ca8de.gz',
    'firehose/2024/04/18/07/audit-message-batch-40-2024-04-18-07-15-08-31904c4a-031d-45a1-9e90-b69a9dce5a30.gz',
    'firehose/2024/04/18/07/audit-message-batch-40-2024-04-18-07-29-16-3b55930e-c43d-43d8-8d7c-7f5af30e2e27.gz',
    'firehose/2024/04/18/07/audit-message-batch-40-2024-04-18-07-43-25-a7dc6fd0-98d9-4edd-8a57-255ad19b8c95.gz',
    'firehose/2024/04/18/07/audit-message-batch-40-2024-04-18-07-57-31-14954665-120a-4234-9268-18dd0bdcc3c8.gz',
    'firehose/2024/04/18/08/audit-message-batch-40-2024-04-18-08-11-45-8a44cd33-7b5c-46db-8847-b2d161a84efd.gz',
    'firehose/2024/04/18/08/audit-message-batch-40-2024-04-18-08-26-22-6a53a200-09f7-4652-bf86-81d124de97dc.gz',
    'firehose/2024/04/18/08/audit-message-batch-40-2024-04-18-08-40-46-d11d9f2e-8ec4-42c8-a86e-a3046c646cff.gz',
    'firehose/2024/04/18/08/audit-message-batch-40-2024-04-18-08-55-42-474a510b-7a9e-4535-8c8d-d2a423eb4b32.gz',
    'firehose/2024/04/18/09/audit-message-batch-40-2024-04-18-09-10-11-97355587-33fd-42e6-bf4e-7c479cea1602.gz',
    'firehose/2024/04/18/09/audit-message-batch-40-2024-04-18-09-24-29-b4e2516b-287c-4fb2-b8ae-3d0d695522c4.gz',
    'firehose/2024/04/18/09/audit-message-batch-40-2024-04-18-09-39-05-90ed6323-5f73-4356-9a8b-b201f3542590.gz',
    'firehose/2024/04/18/09/audit-message-batch-40-2024-04-18-09-53-38-ec1b1215-296c-4f38-8624-ae3eb02f1dd7.gz',
    'firehose/2024/04/18/10/audit-message-batch-40-2024-04-18-10-08-30-566f2cf2-5492-4746-9874-a88a7d5f17f3.gz',
    'firehose/2024/04/18/10/audit-message-batch-40-2024-04-18-10-23-23-2b980e22-b738-4f12-ae6f-f89ae2ca1f03.gz',
    'firehose/2024/04/18/10/audit-message-batch-40-2024-04-18-10-37-52-173cf269-bf2d-4a8d-9399-418e803247a4.gz',
    'firehose/2024/04/18/10/audit-message-batch-40-2024-04-18-10-52-37-5496dfcb-8be2-4d92-a931-4caf98b49370.gz',
    'firehose/2024/04/18/11/audit-message-batch-40-2024-04-18-11-07-14-b930265d-477e-4726-b4e3-9e98c1352a36.gz',
    'firehose/2024/04/18/11/audit-message-batch-40-2024-04-18-11-21-49-978929ea-a216-43ed-a466-47e94a955fc8.gz',
    'firehose/2024/04/18/11/audit-message-batch-40-2024-04-18-11-36-41-1bf729b0-5941-4d55-8368-fd80e3f1f0e0.gz',
    'firehose/2024/04/18/11/audit-message-batch-40-2024-04-18-11-51-10-6759bf87-7d59-480d-bbd6-3bf2dacd5261.gz',
    'firehose/2024/04/18/12/audit-message-batch-40-2024-04-18-12-05-44-2b74c686-92cf-4ee0-8806-5be7b940e30f.gz',
    'firehose/2024/04/18/12/audit-message-batch-40-2024-04-18-12-20-32-9685e90a-3b47-4fdb-bb6d-e390716b2f26.gz',
    'firehose/2024/04/18/12/audit-message-batch-40-2024-04-18-12-35-21-564db37f-aaee-4d43-9d6c-946e401f6432.gz',
    'firehose/2024/04/18/12/audit-message-batch-40-2024-04-18-12-50-06-4e083d50-c0c2-4cfc-996e-7c383e2b8496.gz',
    'firehose/2024/04/18/13/audit-message-batch-40-2024-04-18-13-04-42-79cc7d6f-f535-471d-97d7-8ecc39acae43.gz',
    'firehose/2024/04/18/13/audit-message-batch-40-2024-04-18-13-19-33-be9979fb-ef55-4fed-9b42-4bdfa5ba3db3.gz',
    'firehose/2024/04/18/13/audit-message-batch-40-2024-04-18-13-33-55-9dbc42a5-3a41-458f-ad79-07f8cbb85f38.gz',
    'firehose/2024/04/18/13/audit-message-batch-40-2024-04-18-13-48-13-473fdcd5-97e0-4b3c-a5a7-5b3c08fbc357.gz',
    'firehose/2024/04/18/14/audit-message-batch-40-2024-04-18-14-02-54-a45349e9-0021-4b8b-af26-0f9350e17fc6.gz',
    'firehose/2024/04/18/14/audit-message-batch-40-2024-04-18-14-17-32-eef8a621-4325-465b-8005-fb425b2d9c6c.gz',
    'firehose/2024/04/18/14/audit-message-batch-40-2024-04-18-14-32-17-56f597c1-11d9-41fe-a132-323b971b68bc.gz',
    'firehose/2024/04/18/14/audit-message-batch-40-2024-04-18-14-46-43-0818db8c-ac51-4ee1-a5ab-3a3bf7019e4e.gz',
    'firehose/2024/04/18/15/audit-message-batch-40-2024-04-18-15-01-08-20d66332-654f-4e9c-b170-eb5eee730c41.gz',
    'firehose/2024/04/18/15/audit-message-batch-40-2024-04-18-15-15-39-0fb9f86d-9a3d-40e9-8038-2de08889c90d.gz',
    'firehose/2024/04/18/15/audit-message-batch-40-2024-04-18-15-30-04-6b22e032-4fe2-4f24-84e0-aece4aa149ee.gz',
    'firehose/2024/04/18/15/audit-message-batch-40-2024-04-18-15-44-35-fb4ca4aa-a281-4ea2-9b7d-32b29ea3ba3a.gz',
    'firehose/2024/04/18/15/audit-message-batch-40-2024-04-18-15-59-27-9b101e01-c171-4a67-a1f8-0bab1da1237a.gz',
    'firehose/2024/04/18/16/audit-message-batch-40-2024-04-18-16-13-43-626f03a2-2688-4c40-8826-b88a688a6842.gz',
    'firehose/2024/04/18/16/audit-message-batch-40-2024-04-18-16-28-26-636a8a54-6bf5-4ab2-8c4d-868bdd62cb9a.gz',
    'firehose/2024/04/18/16/audit-message-batch-40-2024-04-18-16-42-59-e9fc308a-716c-4575-ad2b-f3318df9502c.gz',
    'firehose/2024/04/18/16/audit-message-batch-40-2024-04-18-16-57-45-afe2e679-da82-4f8b-aec3-f5b56fd9c9f4.gz',
    'firehose/2024/04/18/17/audit-message-batch-40-2024-04-18-17-12-33-4e318608-2db3-46c0-a9c1-e0eb81abb74f.gz',
    'firehose/2024/04/18/17/audit-message-batch-40-2024-04-18-17-26-59-2ea743ee-acb6-4b0f-a8ca-c8f7f494d5ce.gz',
    'firehose/2024/04/18/17/audit-message-batch-40-2024-04-18-17-41-53-99fef98d-98f1-42be-b73d-a3f73db936e0.gz',
    'firehose/2024/04/18/17/audit-message-batch-40-2024-04-18-17-56-21-1edbb5b9-86bc-43f2-8b49-6181edb6ff64.gz',
    'firehose/2024/04/18/18/audit-message-batch-40-2024-04-18-18-11-08-9576d581-1dce-4eb1-892e-10297288125a.gz',
    'firehose/2024/04/18/18/audit-message-batch-40-2024-04-18-18-25-21-dec88f79-b53d-4949-8d61-efe34b2b1ec8.gz',
    'firehose/2024/04/18/18/audit-message-batch-40-2024-04-18-18-40-16-4d720daf-6099-4f56-8c1a-d9d53dbd2fa0.gz',
    'firehose/2024/04/18/18/audit-message-batch-40-2024-04-18-18-55-10-f8918e68-d751-434c-b796-b9ff8133dfc1.gz',
    'firehose/2024/04/18/19/audit-message-batch-40-2024-04-18-19-09-48-f310224d-084f-44fa-8dfc-5f1951e547cc.gz',
    'firehose/2024/04/18/19/audit-message-batch-40-2024-04-18-19-24-33-ff199b40-4166-43b1-a149-8cf906efd9e1.gz',
    'firehose/2024/04/18/19/audit-message-batch-40-2024-04-18-19-39-29-af56317f-10bf-4eba-8390-8f7cbc07f275.gz',
    'firehose/2024/04/18/19/audit-message-batch-40-2024-04-18-19-54-11-d5d7aa0f-16c5-4ce2-9816-d14ed9cbacfa.gz',
    'firehose/2024/04/18/20/audit-message-batch-40-2024-04-18-20-08-47-83db1683-9838-4ef6-9391-7052344233b5.gz',
    'firehose/2024/04/18/20/audit-message-batch-40-2024-04-18-20-23-47-06d62145-eef2-4a62-86be-3e9f74065afc.gz',
    'firehose/2024/04/18/20/audit-message-batch-40-2024-04-18-20-37-55-3e979881-8033-4c50-bdff-0b2ad1b5822e.gz',
    'firehose/2024/04/18/20/audit-message-batch-40-2024-04-18-20-52-03-ef8b84a9-d83a-4b1e-abe3-cbc90b791886.gz',
    'firehose/2024/04/18/21/audit-message-batch-40-2024-04-18-21-07-04-e5cf251b-200c-4709-97ff-ee3a73887baf.gz',
    'firehose/2024/04/18/21/audit-message-batch-40-2024-04-18-21-21-12-0ad28d9a-d72c-427a-aff9-cfaaa96b0e81.gz',
    'firehose/2024/04/18/21/audit-message-batch-40-2024-04-18-21-35-20-3d814454-b73c-4846-b6cd-b31794ec8ffe.gz',
    'firehose/2024/04/18/21/audit-message-batch-40-2024-04-18-21-49-29-6afc9ae4-159f-4ee4-a2b0-586bd868c9f5.gz',
    'firehose/2024/04/18/22/audit-message-batch-40-2024-04-18-22-03-37-4498cba5-157f-41e1-b638-fa8d00f9dbc3.gz',
    'firehose/2024/04/18/22/audit-message-batch-40-2024-04-18-22-17-49-48e68a0e-b620-4d0d-aa21-3fd7bf5d185e.gz',
    'firehose/2024/04/18/22/audit-message-batch-40-2024-04-18-22-31-59-a44b0551-ffe8-47d0-a047-0321ce2d9fd6.gz',
    'firehose/2024/04/18/22/audit-message-batch-40-2024-04-18-22-46-09-ad1e0c26-c711-4c2c-84f1-90062ae203ef.gz',
    'firehose/2024/04/18/23/audit-message-batch-40-2024-04-18-23-00-20-5855a63b-a7fc-49fc-af4a-fb092991b392.gz',
    'firehose/2024/04/18/23/audit-message-batch-40-2024-04-18-23-14-28-04af5649-f74e-400d-b950-bcd9627660ab.gz',
    'firehose/2024/04/18/23/audit-message-batch-40-2024-04-18-23-28-36-518be517-8c89-4c3a-ba0f-2dc0a4849a77.gz',
    'firehose/2024/04/18/23/audit-message-batch-40-2024-04-18-23-42-44-52f15226-fc81-4bfd-a99e-ecb30f76a8bf.gz',
    'firehose/2024/04/18/23/audit-message-batch-40-2024-04-18-23-56-53-155c9075-5a3b-4eb4-8c2e-12da13e3cd4a.gz',
    'firehose/2024/04/19/00/audit-message-batch-40-2024-04-19-00-11-07-7622b073-5096-4823-b304-0cfd3cdd0cdc.gz',
    'firehose/2024/04/19/00/audit-message-batch-40-2024-04-19-00-25-22-80da661f-6f79-4ec8-90bc-fbffc8c459eb.gz',
    'firehose/2024/04/19/00/audit-message-batch-40-2024-04-19-00-39-34-7def74d9-4ee8-47a3-aca9-8d44476a8a82.gz',
    'firehose/2024/04/19/00/audit-message-batch-40-2024-04-19-00-53-42-3c0523a7-aa33-447d-af26-8120f5853347.gz',
    'firehose/2024/04/19/01/audit-message-batch-40-2024-04-19-01-07-55-afe8f4c5-3d5b-44d4-93aa-f8c419213cc5.gz',
    'firehose/2024/04/19/01/audit-message-batch-40-2024-04-19-01-22-10-909107b3-2879-4c8d-b915-1bf377a332ea.gz',
    'firehose/2024/04/19/01/audit-message-batch-40-2024-04-19-01-36-25-f0e450b1-5e38-4d48-bd49-70339e66dcc7.gz',
    'firehose/2024/04/19/01/audit-message-batch-40-2024-04-19-01-50-38-90070dd3-6832-4fb2-9cf9-deff7dcea933.gz',
    'firehose/2024/04/19/02/audit-message-batch-40-2024-04-19-02-05-00-9f716cc6-6fcd-478d-91c1-965a256feee2.gz',
    'firehose/2024/04/19/02/audit-message-batch-40-2024-04-19-02-19-14-0268a14a-b004-4755-b26e-7506c41723a4.gz',
    'firehose/2024/04/19/02/audit-message-batch-40-2024-04-19-02-33-26-8dfd455d-6be4-4f3b-96ed-72859aa98b08.gz',
    'firehose/2024/04/19/02/audit-message-batch-40-2024-04-19-02-47-46-fa899351-c53b-45fa-a49b-d2b2d77ea582.gz',
    'firehose/2024/04/19/03/audit-message-batch-40-2024-04-19-03-02-06-ffd39de4-2afe-4e15-9e3d-7b2b4642aa63.gz',
    'firehose/2024/04/19/03/audit-message-batch-40-2024-04-19-03-16-34-5ae6bb0e-0453-4e82-be34-9681314ee32c.gz',
    'firehose/2024/04/19/03/audit-message-batch-40-2024-04-19-03-30-52-e1b98217-86fe-4c81-9b6c-690b9b6a108d.gz',
    'firehose/2024/04/19/03/audit-message-batch-40-2024-04-19-03-45-18-366b36e4-1b32-4187-8c04-75b7a22bbd34.gz',
    'firehose/2024/04/19/03/audit-message-batch-40-2024-04-19-03-59-34-12e210a0-0cda-4943-8337-73fbc3d772ac.gz',
    'firehose/2024/04/19/04/audit-message-batch-40-2024-04-19-04-13-46-52f1b109-d026-4a1b-aaf9-292ace632396.gz',
    'firehose/2024/04/19/04/audit-message-batch-40-2024-04-19-04-28-10-1c07ce33-a49f-4866-8da8-676bef81c922.gz',
    'firehose/2024/04/19/04/audit-message-batch-40-2024-04-19-04-42-26-7cd03f6b-afd2-4a4e-a745-47b4289b1f04.gz',
    'firehose/2024/04/19/04/audit-message-batch-40-2024-04-19-04-56-34-f11c1325-c28d-48ae-83e5-4456e8b2740a.gz',
    'firehose/2024/04/19/05/audit-message-batch-40-2024-04-19-05-10-48-8a4f92e2-cbca-4c65-b4f1-4eaaf3110f3d.gz',
    'firehose/2024/04/19/05/audit-message-batch-40-2024-04-19-05-24-56-dd033595-cc6d-4aed-9d04-2a07f7538bf1.gz',
    'firehose/2024/04/19/05/audit-message-batch-40-2024-04-19-05-39-06-5ed546ee-2b00-4204-8448-6a4c30db4dc4.gz',
    'firehose/2024/04/19/05/audit-message-batch-40-2024-04-19-05-53-17-edf6a482-cf16-4c0d-bfcb-4634c15c46ea.gz',
    'firehose/2024/04/19/06/audit-message-batch-40-2024-04-19-06-07-28-468ceea5-1291-4dba-ab48-55e4aab94adb.gz',
    'firehose/2024/04/19/06/audit-message-batch-40-2024-04-19-06-21-37-9f4f6488-d1ef-4717-bb52-e5ec27e20ec7.gz',
    'firehose/2024/04/19/06/audit-message-batch-40-2024-04-19-06-35-43-27bf8873-af9e-495a-b6ba-41ac49f50c46.gz',
    'firehose/2024/04/19/06/audit-message-batch-40-2024-04-19-06-49-50-ada72009-825d-4015-a142-113b06405a83.gz',
    'firehose/2024/04/19/07/audit-message-batch-40-2024-04-19-07-03-57-3150888c-5377-4bee-8e00-3892574df2a2.gz',
    'firehose/2024/04/19/07/audit-message-batch-40-2024-04-19-07-18-07-3b6db653-4453-4843-b771-c4928fea6922.gz',
    'firehose/2024/04/19/07/audit-message-batch-40-2024-04-19-07-32-15-09dae2d7-d08f-436d-9c89-cfbcf4c78cac.gz',
    'firehose/2024/04/19/07/audit-message-batch-40-2024-04-19-07-46-24-1985c25e-c0ca-43ac-948d-44881444587b.gz',
    'firehose/2024/04/19/08/audit-message-batch-40-2024-04-19-08-01-07-b50260c9-ee15-4da7-b5a1-09aa825be187.gz',
    'firehose/2024/04/19/08/audit-message-batch-40-2024-04-19-08-15-18-aac61b5f-1cfe-4692-8693-b807788708b4.gz',
    'firehose/2024/04/19/08/audit-message-batch-40-2024-04-19-08-29-45-c032bc3f-aad6-4e5d-9683-107e0f4ca4a1.gz',
    'firehose/2024/04/19/08/audit-message-batch-40-2024-04-19-08-44-14-d37882bd-aebc-49ae-bc35-70ae62b0a6f0.gz',
    'firehose/2024/04/19/08/audit-message-batch-40-2024-04-19-08-59-06-e66b2654-9196-444a-92ad-8c6841fe5c51.gz',
    'firehose/2024/04/19/09/audit-message-batch-40-2024-04-19-09-14-03-6b260bd4-10aa-4161-833e-57c4eb878938.gz',
    'firehose/2024/04/19/09/audit-message-batch-40-2024-04-19-09-28-40-ffa56fb5-959b-476b-8ace-06b92af6d29d.gz',
    'firehose/2024/04/19/09/audit-message-batch-40-2024-04-19-09-43-01-736053fb-8057-4460-a6e5-d3181bfea928.gz',
    'firehose/2024/04/19/09/audit-message-batch-40-2024-04-19-09-57-19-ff2b5408-4377-488d-98c7-671b1b92cbf3.gz',
    'firehose/2024/04/19/10/audit-message-batch-40-2024-04-19-10-11-47-3c24e810-c20a-4813-b298-7abdd2c5905d.gz',
    'firehose/2024/04/19/10/audit-message-batch-40-2024-04-19-10-26-44-5c3e7e35-5ae0-4b92-ae2b-fe8fa2667b44.gz',
    'firehose/2024/04/19/10/audit-message-batch-40-2024-04-19-10-41-16-06b27179-d1b9-4e67-abbc-6d876ad19104.gz',
    'firehose/2024/04/19/10/audit-message-batch-40-2024-04-19-10-56-05-3f540762-e252-4912-ba6d-a7842d985916.gz',
    'firehose/2024/04/19/11/audit-message-batch-40-2024-04-19-11-11-01-0c183266-7b25-4585-af2b-6fce6e1ad369.gz',
    'firehose/2024/04/19/11/audit-message-batch-40-2024-04-19-11-26-00-620207b0-e654-462b-b414-8c8244724031.gz',
    'firehose/2024/04/19/11/audit-message-batch-40-2024-04-19-11-40-19-a0ac8fb6-d387-4887-bb22-75cbbd5fd1c2.gz',
    'firehose/2024/04/19/11/audit-message-batch-40-2024-04-19-11-54-58-efb192db-2fc8-4972-a2ed-5d0b5f0cbe30.gz',
    'firehose/2024/04/19/12/audit-message-batch-40-2024-04-19-12-09-50-1dfd783e-54f3-4678-a1b8-9b9c4281d1e6.gz',
    'firehose/2024/04/19/12/audit-message-batch-40-2024-04-19-12-24-45-f2e146eb-5473-408c-b928-cd962274b9da.gz',
    'firehose/2024/04/19/12/audit-message-batch-40-2024-04-19-12-39-22-8b3c4b25-85e2-4eee-b0d2-63e0d418c990.gz',
    'firehose/2024/04/19/12/audit-message-batch-40-2024-04-19-12-53-53-7f24e44f-99c4-4560-adaf-5785f6e9afb6.gz',
    'firehose/2024/04/19/13/audit-message-batch-40-2024-04-19-13-08-12-27f5e285-8acf-4060-9e25-577748ba436a.gz',
    'firehose/2024/04/19/13/audit-message-batch-40-2024-04-19-13-22-43-40d41b72-9f2b-4e68-96b9-ce641487a951.gz',
    'firehose/2024/04/19/13/audit-message-batch-40-2024-04-19-13-37-33-35bd7c53-82c8-4f2c-8625-ef430796d564.gz',
    'firehose/2024/04/19/13/audit-message-batch-40-2024-04-19-13-51-57-fcfc9d88-8baa-4057-b974-d29b47bcdac9.gz',
    'firehose/2024/04/19/14/audit-message-batch-40-2024-04-19-14-06-30-d35abc72-92ea-4f53-831e-0882883609ac.gz',
    'firehose/2024/04/19/14/audit-message-batch-40-2024-04-19-14-21-03-9a68749a-8a50-4ed3-a921-8afc4444e164.gz',
    'firehose/2024/04/19/14/audit-message-batch-40-2024-04-19-14-35-17-f7f49390-35cb-4d3d-be4c-d15f60dff82f.gz',
    'firehose/2024/04/19/14/audit-message-batch-40-2024-04-19-14-50-16-879d21a5-0422-40b8-b33e-8148cf5c39ed.gz',
    'firehose/2024/04/19/15/audit-message-batch-40-2024-04-19-15-04-52-b64af67a-c1e9-40c4-857a-d5eb3fb92e44.gz',
    'firehose/2024/04/19/15/audit-message-batch-40-2024-04-19-15-19-34-87aefb59-4ec9-4061-acba-45c711217b66.gz',
    'firehose/2024/04/19/15/audit-message-batch-40-2024-04-19-15-34-25-c964a02a-2d9a-4d96-9f24-77efd78806e7.gz',
    'firehose/2024/04/19/15/audit-message-batch-40-2024-04-19-15-49-23-b83c8231-3d16-4052-b9ed-18d21e0aed7d.gz',
    'firehose/2024/04/19/16/audit-message-batch-40-2024-04-19-16-03-31-575fe905-f3b9-4324-9861-6c342a9da15f.gz',
    'firehose/2024/04/19/16/audit-message-batch-40-2024-04-19-16-18-22-a387a79a-19b4-4aaf-8909-b02ad1881c60.gz',
    'firehose/2024/04/19/16/audit-message-batch-40-2024-04-19-16-33-19-d3d0257f-d7d5-4c87-9597-576924ef99c7.gz',
    'firehose/2024/04/19/16/audit-message-batch-40-2024-04-19-16-48-17-5f15faa1-dfef-4631-8cb4-2c28893a3736.gz',
    'firehose/2024/04/19/17/audit-message-batch-40-2024-04-19-17-02-39-d1c28e2c-3ab5-407e-bdd4-8449f96b563b.gz',
    'firehose/2024/04/19/17/audit-message-batch-40-2024-04-19-17-17-07-dae73ae5-75aa-4cc3-a1a9-5e9413996fa1.gz',
    'firehose/2024/04/19/17/audit-message-batch-40-2024-04-19-17-31-16-60b2dc94-1bdc-421e-8586-629c2d5473d9.gz',
    'firehose/2024/04/19/17/audit-message-batch-40-2024-04-19-17-45-26-f85356d4-d884-4493-86b4-dc1acc185743.gz',
    'firehose/2024/04/19/17/audit-message-batch-40-2024-04-19-17-59-35-588ae80f-c24e-4b56-910f-55eedc962ca8.gz',
    'firehose/2024/04/19/18/audit-message-batch-40-2024-04-19-18-13-44-be7b5ec8-cc76-4d29-9c41-ca17f6aad3ac.gz',
    'firehose/2024/04/19/18/audit-message-batch-40-2024-04-19-18-28-41-b933a664-b121-4063-8ba2-4c51c50b4470.gz',
    'firehose/2024/04/19/18/audit-message-batch-40-2024-04-19-18-42-50-b9e6c43e-ac15-428d-a2c1-e0ead7f64999.gz',
    'firehose/2024/04/19/18/audit-message-batch-40-2024-04-19-18-56-59-0f793a56-306d-4776-b9a5-ecfab166e0e4.gz',
    'firehose/2024/04/19/19/audit-message-batch-40-2024-04-19-19-11-02-de210165-beda-4076-bde3-debffaf54691.gz',
    'firehose/2024/04/19/19/audit-message-batch-40-2024-04-19-19-25-11-90c72595-71ea-446d-b701-3c2206968b19.gz',
    'firehose/2024/04/19/19/audit-message-batch-40-2024-04-19-19-39-19-0b68b727-0365-4e5d-8141-00bb877c8963.gz',
    'firehose/2024/04/19/19/audit-message-batch-40-2024-04-19-19-53-26-7993cba6-6c6e-414c-b35d-810b83083290.gz',
    'firehose/2024/04/19/20/audit-message-batch-40-2024-04-19-20-07-35-d1805ad1-9d7a-4bd1-96ca-adc02c183775.gz',
    'firehose/2024/04/19/20/audit-message-batch-40-2024-04-19-20-21-43-794b3e1e-a5e0-4264-a776-e75fcffbe65c.gz',
    'firehose/2024/04/19/20/audit-message-batch-40-2024-04-19-20-35-53-c24e41cd-39fa-4fde-976d-a35a584bbdae.gz',
    'firehose/2024/04/19/20/audit-message-batch-40-2024-04-19-20-50-02-d4b25fe4-a3ee-4d23-b2d8-33c3dac9ea81.gz',
    'firehose/2024/04/19/21/audit-message-batch-40-2024-04-19-21-04-11-402e51bf-b8fb-4763-b7b0-9da559963b96.gz',
    'firehose/2024/04/19/21/audit-message-batch-40-2024-04-19-21-18-19-2a67f306-82a1-4dfc-a7f9-214de57e6025.gz',
    'firehose/2024/04/19/21/audit-message-batch-40-2024-04-19-21-32-28-df8a8355-7b93-417e-aedc-53c6094d9ec4.gz',
    'firehose/2024/04/19/21/audit-message-batch-40-2024-04-19-21-46-36-36f9a17a-6d42-47a4-8862-8f21af3750f2.gz',
    'firehose/2024/04/19/22/audit-message-batch-40-2024-04-19-22-00-45-60e0255e-5525-4ec2-ae22-c8d2002f8147.gz',
    'firehose/2024/04/19/22/audit-message-batch-40-2024-04-19-22-14-55-d5a6931b-85a7-4ae6-a52e-e61659a97997.gz',
    'firehose/2024/04/19/22/audit-message-batch-40-2024-04-19-22-29-03-b956b815-4577-4a5e-83a0-852eb3d7cb53.gz',
    'firehose/2024/04/19/22/audit-message-batch-40-2024-04-19-22-43-16-68dfb2eb-858a-4687-87a5-8a703f5b8d20.gz',
    'firehose/2024/04/19/22/audit-message-batch-40-2024-04-19-22-57-24-acd0d2f6-73f3-493a-81ce-40814d19deb4.gz',
    'firehose/2024/04/19/23/audit-message-batch-40-2024-04-19-23-11-39-db53b0a2-f510-43b5-9986-a0e2377732d1.gz',
    'firehose/2024/04/19/23/audit-message-batch-40-2024-04-19-23-25-50-2f21e97a-b9e7-4b08-874b-51e3f8bb8164.gz',
    'firehose/2024/04/19/23/audit-message-batch-40-2024-04-19-23-40-03-fdba571c-9510-49f1-b83a-ee2e6cf90494.gz'
  ]
}

const s3 = new S3Client({ region: 'eu-west-2' })

export const expedite = async () => {
  const res = payload.glacierTierLocationsToCopy.map(async (obj) => {
    const restoreCommand: RestoreObjectCommandInput = {
      Bucket: 'audit-production-permanent-message-batch',
      Key: obj,
      RestoreRequest: {
        Days: 5,
        GlacierJobParameters: {
          Tier: 'Expedited'
        }
      }
    }
    await rps()
    const res = await s3.send(new RestoreObjectCommand(restoreCommand))
    console.log(
      'restored ' +
        obj +
        '. Response from restore command: ' +
        res.RestoreOutputPath
    )
  })

  await Promise.allSettled(res)
}

export const inspect = async () => {
  const promiseArray = payload.glacierTierLocationsToCopy.map(async (obj) => {
    const headCommand = {
      Bucket: 'audit-production-permanent-message-batch',
      Key: obj
    }

    await rps()
    const res = await s3.send(new HeadObjectCommand(headCommand))
    console.log('object: ' + obj + ' restore status: ' + res.Restore)
  })

  await Promise.allSettled(promiseArray)
}

inspect().then(() => {
  console.log('complete')
})
