import { Extract } from '../src/pg-to-ts-classes';
import { cleanup, connect, resetTestDatabase } from './utility';

/**
 * @jest-environment node
 */

describe('The library can be used', () => {
  const testDbName = 'test_index';
  beforeAll(async () => {
    await resetTestDatabase(testDbName);
  });
  afterAll(async () => {
    await cleanup(testDbName);
  });
  it('shall function!', async () => {
    const db = await connect(testDbName);
    await Extract({
      directory: 'output',
      pg: db,
      schemas: ['media', 'accounting'],
    });
  });
});
