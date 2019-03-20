import * as _ from 'lodash';

export const PascalCase = (input: string) => {
  const s = _.camelCase(input);
  if (input.length < 1) { return input; }
  return s[0].toUpperCase() + s.substr(1);
};