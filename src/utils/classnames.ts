/**
 * A utility for conditionally joining CSS class names together
 *
 * @example
 * classNames('foo', 'bar'); // => 'foo bar'
 * classNames('foo', { bar: true }); // => 'foo bar'
 * classNames({ 'foo-bar': false }); // => ''
 * classNames({ 'foo-bar': true }); // => 'foo-bar'
 * classNames({ foo: true }, { bar: true }); // => 'foo bar'
 * classNames({ foo: true, bar: false }); // => 'foo'
 * classNames(null, false, 'bar', undefined, 0, 1, { baz: null }, ''); // => 'bar 1'
 */
export function classNames(...args: any[]): string {
  const classes: string[] = [];

  for (const arg of args) {
    if (!arg) continue;

    const argType = typeof arg;

    if (argType === 'string' || argType === 'number') {
      classes.push(arg.toString());
    } else if (Array.isArray(arg)) {
      if (arg.length) {
        const inner = classNames(...arg);
        if (inner) {
          classes.push(inner);
        }
      }
    } else if (argType === 'object') {
      for (const key in arg) {
        if (Object.prototype.hasOwnProperty.call(arg, key) && arg[key]) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}

// Also export as default for convenience
export default classNames;

// Re-export cn function from lib/utils
export { cn } from '@/lib/utils';
