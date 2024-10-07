/** Using this file to process openapi config file and generate types
 * ... This file is necessary to modify behavior to create Date type correctly
 */

import fs from 'node:fs';
import openapiTS, { astToString } from 'openapi-typescript';
import ts from 'typescript';

/** File name of openapi config */
const FILE_NAME = 'openapi.yaml';

const localPath = new URL(`./${FILE_NAME}`, import.meta.url);

const DATE = ts.factory.createTypeReferenceNode(
  ts.factory.createIdentifier('Date'),
); // `Date`
const NULL = ts.factory.createLiteralTypeNode(ts.factory.createNull()); // `null`

const output = await openapiTS(localPath, {
  transform: (schemaObject, metadata) => {
    if (schemaObject.format === 'date-time') {
      return schemaObject.nullable
        ? ts.factory.createUnionTypeNode([DATE, NULL])
        : DATE;
    }
  },
  emptyObjectsUnknown: true,
  exportType: true
});
const contents = astToString(output)

fs.writeFileSync("./docs/openapi.d.ts", contents);
