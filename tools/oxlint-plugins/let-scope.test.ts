import { describe, it } from 'vitest';
import { RuleTester } from 'oxlint/plugins-dev';
import plugin from './let-scope.ts';

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({ languageOptions: { sourceType: 'module', parserOptions: { lang: 'ts' } } });

tester.run('no-top-level-let', plugin.rules['no-top-level-let'], {
  valid: [
    'const count = 0',
    'const sum = (xs: number[]) => { let total = 0; for (const x of xs) { total = total + x } return total }',
    'const createTimer = () => { let timerId: number | undefined; return { stop: () => clearTimeout(timerId) } }',
    'export const usePresenter = () => { let frame = 0; return () => frame }',
    'for (let i = 0; i < 3; i = i + 1) {}',
    '{ let scoped = 0 }',
  ],
  invalid: [
    { code: 'let count = 0', errors: [{ messageId: 'topLevel' }] },
    { code: 'export let count = 0', errors: [{ messageId: 'topLevel' }] },
    { code: 'let a = 0, b = 1', errors: [{ messageId: 'topLevel' }] },
  ],
});

tester.run('no-value-box', plugin.rules['no-value-box'], {
  valid: [
    'const createFlag = () => { let loggedIn = false; return () => { loggedIn = true } }',
    'const option = { value: 1 }; console.log(option.value)',
    'const count = ref(0); count.value = 1',
    'const pair = { value: 1, label: "a" }; pair.value = 2',
  ],
  invalid: [
    {
      code: 'const createFlag = () => { const loggedIn = { value: false }; return () => { loggedIn.value = true } }',
      errors: [{ messageId: 'box' }],
    },
    {
      code: 'const latest = { value: 0 }; export const set = (n: number) => { latest.value = n }',
      errors: [{ messageId: 'box' }],
    },
  ],
});
