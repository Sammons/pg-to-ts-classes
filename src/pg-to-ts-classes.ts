import * as pg from 'pg';
import { Queries } from './extraction-queries';
import { Render } from './rendering/render-top-index';

interface ExtractionToDirParams {
  pg: pg.Pool | pg.Client;
  directory: string;
  schemas?: string[];
}

interface ExtractionRawParams {
  pg: pg.Pool | pg.Client;
  schemas?: string[];
}

export const Extract = async (params: ExtractionToDirParams) => {
  const schemas = params.schemas || ['public'];
  const results = await new Queries(params.pg).gather({ schemas });
  await Render(params.directory, results);
};

export const ExtractRaw = async (params: ExtractionRawParams) => {
  const schemas = params.schemas || ['public'];
  return new Queries(params.pg).gather({ schemas });
};