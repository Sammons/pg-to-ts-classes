import { ExtractedSchema } from '../extraction-interfaces';
import { fsp } from '../common/fsp';
import * as _ from 'lodash';
import { PascalCase } from '../common/helpers';

export const Render = async (targetDirectory: string, schemas: Map<string, ExtractedSchema>) => {
  // render the index.ts
  if (!await fsp.exists(targetDirectory)) {
    await fsp.ensureDir(targetDirectory);
  }
  const imports = Array.from(schemas.keys()).map(s => `import * as ${PascalCase(s)} from './${s}/index';`);
  const exports = Array.from(schemas.keys()).map(s => `${PascalCase(s)}`).join(', ');
  const template =
    [
      `${imports.join('\n')}`,
      `export {${exports}};`,
    ].join('\n');
  await fsp.writeFile(targetDirectory + '/index.ts', template);

  // create the schema directories
  for (const schema of schemas.keys()) {
    await fsp.ensureDir(`${targetDirectory}/${schema}/tables`);
    await fsp.ensureDir(`${targetDirectory}/${schema}/views`);
    const actualSchema = schemas.get(schema)!;
    // create tables
    await Promise.all(actualSchema.tables.map(async table => {
      const template = [
        `export interface ${PascalCase(table.tablename)} {`,
        // TODO: RENDERING COLUMS
        ...table.columns.map(c => `  ${_.camelCase(c.columnname)}`),
        '}',
        `export class ${PascalCase(table.tablename)} implements ${PascalCase(table.tablename)} {`,
        '}',
      ].join('\n');
      await fsp.writeFile(`${targetDirectory}/${schema}/tables/${_.kebabCase(table.tablename)}.ts`, template);
    }));
    await fsp.writeFile(
      `${targetDirectory}/${schema}/tables.ts`,
      actualSchema.tables.map(t => `export {${PascalCase(t.tablename)}} from './tables/${_.kebabCase(t.tablename)}';`).join('\n')
    );
    // create views
    const viewsExist = !_.isEmpty(actualSchema.views);
    if (viewsExist) {
      await Promise.all(actualSchema.views.map(async table => {
        const template = [
          `export interface ${PascalCase(table.viewname)} {}`,
          `export class ${PascalCase(table.viewname)} implements ${PascalCase(table.viewname)} {`,
          '}',
        ].join('\n');
        await fsp.writeFile(`${targetDirectory}/${schema}/views/${_.kebabCase(table.viewname)}.ts`, template);
      }));
      await fsp.writeFile(
        `${targetDirectory}/${schema}/views.ts`,
        actualSchema.views.map(v => `export {${PascalCase(v.viewname)}} from './views/${_.kebabCase(v.viewname)}';`).join('\n')
      );
    }
    await fsp.writeFile(
      `${targetDirectory}/${schema}/index.ts`,
      [
        'import * as Tables from \'./tables\';',
        viewsExist ? 'import * as Views from \'./views\';' : '// no views',
        `export {Tables${viewsExist ? ', Views' : ''}};`,
      ].join('\n')
    );
  }
};