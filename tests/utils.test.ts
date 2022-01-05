import { copy, freeze } from '../src/utils';

test('freeze & copy', () => {
  const obj = { prop: 'test', nestedProp: { child: 'test' } };

  expect(Object.isFrozen(obj)).toBe(false);
  freeze(obj);
  expect(Object.isFrozen(obj)).toBe(true);
  expect(Object.isFrozen(obj.nestedProp)).toBe(true);

  const _obj = copy(obj);
  expect(Object.isFrozen(_obj)).toBe(false);
  expect(Object.isFrozen(_obj.nestedProp)).toBe(false);
});
