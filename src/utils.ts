import { O } from './types';

// deep-freeze for immutability
export function freeze<T extends O>(obj: T): T {
  if (Object.isFrozen(obj)) return obj;
  Object.freeze(obj);
  Object.keys(obj).forEach((prop: string) => {
    if (typeof obj[prop] !== 'object' || Object.isFrozen(obj[prop])) return;
    freeze(obj[prop] as O);
  });
  return obj;
}

// copy frozen object
export function copy<T extends O>(obj: T): T {
  const _obj = Object.assign({}, obj);
  Object.keys(_obj).forEach((prop: string) => {
    if (typeof obj[prop] === 'object' && obj[prop] !== null)
      (_obj[prop] as O) = copy(_obj[prop] as O);
  });
  return _obj;
}
