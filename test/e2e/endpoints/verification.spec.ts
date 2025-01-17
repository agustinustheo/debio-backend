import request from 'supertest';
import { Server } from 'http';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  DateTimeModule,
  TransactionLoggingModule,
  SubstrateModule,
  SubstrateService,
} from '../../../src/common';
import { VerificationModule } from '../../../src/endpoints/verification/verification.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionRequest } from '../../../src/common/modules/transaction-logging/models/transaction-request.entity';
import { dummyCredentials } from '../config';
import {
  GCloudSecretManagerModule,
  GCloudSecretManagerService,
} from '@debionetwork/nestjs-gcloud-secret-manager';
import { keyList, SecretKeyList } from '../../../src/common/secrets';

describe('Verification Controller (e2e)', () => {
  let server: Server;
  let app: INestApplication;
  let api: SubstrateService;
  let gcloudSecretManagerService: GCloudSecretManagerService<keyList>;

  const apiKey = 'DEBIO_API_KEY';

  class GoogleSecretManagerServiceMock {
    _secretsList = new Map<string, string>([
      ['ELASTICSEARCH_NODE', process.env.ELASTICSEARCH_NODE],
      ['ELASTICSEARCH_USERNAME', process.env.ELASTICSEARCH_USERNAME],
      ['ELASTICSEARCH_PASSWORD', process.env.ELASTICSEARCH_PASSWORD],
      ['ADMIN_SUBSTRATE_MNEMONIC', process.env.ADMIN_SUBSTRATE_MNEMONIC],
      ['DEBIO_API_KEY', apiKey],
      ['SUBSTRATE_URL', process.env.SUBSTRATE_URL],
    ]);
    loadSecrets() {
      return null;
    }

    getSecret(key) {
      return this._secretsList.get(key);
    }
  }

  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GCloudSecretManagerModule.withConfig(process.env.PARENT, SecretKeyList),
        TypeOrmModule.forRoot({
          ...dummyCredentials,
          database: 'db_postgres',
          entities: [TransactionRequest],
          autoLoadEntities: true,
        }),
        VerificationModule,
        SubstrateModule,
        TransactionLoggingModule,
        DateTimeModule,
      ],
    })
      .overrideProvider(GCloudSecretManagerService)
      .useClass(GoogleSecretManagerServiceMock)
      .compile();

    api = module.get(SubstrateService);
    gcloudSecretManagerService = module.get(GCloudSecretManagerService);

    app = module.createNestApplication();
    server = app.getHttpServer();
    await app.init();
  }, 60000);

  afterAll(async () => {
    await api.stopListen();
    api.destroy();
    await app.close();
  }, 30000);

  it('POST /verification/lab: updateStatusLab should return', async () => {
    // Arrange
    const ACCOUNT_ID = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    const VERIFICATION_STATUS = 'Unverified';

    // Act
    const result = await request(server)
      .post(
        `/verification/lab?account_id=${ACCOUNT_ID}&verification_status=${VERIFICATION_STATUS}`,
      )
      .set(
        'debio-api-key',
        gcloudSecretManagerService.getSecret('DEBIO_API_KEY').toString(),
      )
      .send();

    // Assert
    expect(
      result.text.includes(`Lab ${ACCOUNT_ID} ${VERIFICATION_STATUS}`),
    ).toBeTruthy();
    expect(result.status).toEqual(200);
  }, 60000);

  it('POST /verification/genetic-analysts: updateStatusGeneticAnalyst should return', async () => {
    // Arrange
    const ACCOUNT_ID = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    const VERIFICATION_STATUS = 'Verified';

    // Act
    const result = await request(server)
      .post(
        `/verification/genetic-analysts?account_id=${ACCOUNT_ID}&verification_status=${VERIFICATION_STATUS}`,
      )
      .set(
        'debio-api-key',
        gcloudSecretManagerService.getSecret('DEBIO_API_KEY').toString(),
      )
      .send();

    // Assert
    expect(result.text.includes(`Genetic Analyst ${ACCOUNT_ID}`)).toBeTruthy();
    expect(result.status).toEqual(200);
  }, 60000);
});
