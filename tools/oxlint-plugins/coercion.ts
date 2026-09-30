import type { RuleTester } from 'oxlint/plugins-dev';

type Rule = Exclude<Parameters<RuleTester['run']>[1], { createOnce: unknown }>;
type Visitor = ReturnType<Rule['create']>;
type CallLike =
  | Parameters<NonNullable<Visitor['CallExpression']>>[0]
  | Parameters<NonNullable<Visitor['NewExpression']>>[0];

const WRAPPERS: ReadonlySet<string> = new Set(['Number', 'String', 'Boolean']);

const isWrapper = (node: CallLike['callee'] | CallLike['arguments'][number]): boolean =>
  node.type === 'Identifier' && WRAPPERS.has(node.name);

const noWrapperCoercion: Rule = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow coercion through the Number / String / Boolean wrappers.' },
    messages: {
      call: 'Convert explicitly: parseInt(x, 10) / parseFloat(x) / `${x}` / an explicit === or !== (skill explicit-primitive-conversion).',
      callback:
        'Passing a wrapper as a callback hides which values it keeps. Write the predicate or parser explicitly (skill explicit-primitive-conversion).',
    },
    schema: [],
  },
  create(context) {
    const check = (node: CallLike): void => {
      if (isWrapper(node.callee)) {
        context.report({ node, messageId: 'call' });
        return;
      }
      for (const argument of node.arguments) {
        if (isWrapper(argument)) context.report({ node: argument, messageId: 'callback' });
      }
    };
    return { CallExpression: check, NewExpression: check };
  },
};

const plugin = {
  meta: { name: 'coercion' },
  rules: {
    'no-wrapper-coercion': noWrapperCoercion,
  },
};

export default plugin;
