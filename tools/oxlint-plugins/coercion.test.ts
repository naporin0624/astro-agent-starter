import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vitest';

import plugin from './coercion.ts';

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({ languageOptions: { sourceType: 'module', parserOptions: { lang: 'ts' } } });

tester.run('no-wrapper-coercion', plugin.rules['no-wrapper-coercion'], {
  valid: [
    "const n = parseInt('1', 10)",
    "const f = parseFloat('1.5')",
    'const s = `${1}`',
    "const ok = Number.isFinite(parseInt('1', 10))",
    'const max = Number.MAX_SAFE_INTEGER',
    "const xs = ['a', ''].filter((x) => x !== '')",
  ],
  invalid: [
    { code: "const n = Number('1')", errors: [{ messageId: 'call' }] },
    { code: "const n = new Number('1')", errors: [{ messageId: 'call' }] },
    { code: 'const s = String(1)', errors: [{ messageId: 'call' }] },
    { code: 'const b = Boolean(1)', errors: [{ messageId: 'call' }] },
    { code: "const xs = ['a', ''].filter(Boolean)", errors: [{ messageId: 'callback' }] },
    { code: "const ns = ['1'].map(Number)", errors: [{ messageId: 'callback' }] },
  ],
});
