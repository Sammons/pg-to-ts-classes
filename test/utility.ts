import * as pg from 'pg';
import * as setup from './sample-schema';

const poolCache: { [database: string]: pg.Pool } = {};

export const config: pg.PoolConfig = {
  application_name: 'morbid_test',
  idleTimeoutMillis: 100,
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',
  port: 5433,
  user: 'postgres',
  // must have at least 2 or else transaction tests will never work
  min: 2,
  max: 2,
};

export const connect = async (testDbName: string = 'test') => {
  if (poolCache[testDbName]) {
    return await poolCache[testDbName];
  }
  try {
    const pool = new pg.Pool({
      ...config,
      database: testDbName,
    });
    poolCache[testDbName] = pool;
    pool.on('error' as any, (e: any & { code: any }) => {
      if (e['code'] === '57P01') {
        console.log(`Pool connected to ${testDbName} killed.`);
      } else {
        console.log(`disregarded pool ${testDbName} error during test`, e);
      }
    });
    return poolCache[testDbName];
  } catch (e) {
    throw new Error('Failed to connect: ' + e.message);
  }
};

export const resetTestDatabase = async (testDbName: string) => {
  const masterClient = await connect('postgres');
  const res = await masterClient.query('select * from pg_catalog.pg_database where datname=$1', [testDbName]);
  if (res.rowCount < 1) {
    const escape = pg.Client.prototype.escapeIdentifier;
    const name = escape(testDbName);
    await masterClient.query(`drop database if exists ${name};`, []);
    await masterClient.query(`create database ${name};`, []);
    const testClient = await connect(testDbName);
    await testClient.query(setup.sql());
  }
};

export const cleanup = async (testDbName?: string) => {
  const endDb = async (db: string) => {
    try {
      if (poolCache[db]) {
        await poolCache[db].end().catch(e => null /* doesn't matter */);
        delete poolCache[db];
      }
    } catch (e) {
      console.log('failed to end a pool normally', e);
    }
  };
  if (testDbName) {
    return endDb(testDbName);
  } else {
    await Promise.all(Object.keys(poolCache).map(endDb));
  }
};