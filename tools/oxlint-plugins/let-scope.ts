import type { RuleTester } from 'oxlint/plugins-dev';

type Rule = Exclude<Parameters<RuleTester['run']>[1], { createOnce: unknown }>;
type Visitor = ReturnType<Rule['create']>;
type NodeOf<K extends string> = Parameters<NonNullable<Visitor[K]>>[0];
type VariableDeclaration = NodeOf<'VariableDeclaration'>;
type VariableDeclarator = NodeOf<'VariableDeclarator'>;
type AssignmentTarget = NodeOf<'AssignmentExpression'>['left'];

const isModuleScope = ({ parent }: VariableDeclaration): boolean =>
  parent.type === 'Program' || (parent.type === 'ExportNamedDeclaration' && parent.parent.type === 'Program');

const noTopLevelLet: Rule = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow `let` at module top level. `let` is allowed inside functions and blocks.' },
    messages: {
      topLevel:
        'Module-level `let` is shared by every importer. Move it into a factory or presenter function, or use `const`.',
    },
    schema: [],
  },
  create(context) {
    return {
      VariableDeclaration(node) {
        if (node.kind !== 'let' || !isModuleScope(node)) return;
        context.report({ node, messageId: 'topLevel' });
      },
    };
  },
};

type ObjectProperty = Extract<
  NonNullable<VariableDeclarator['init']>,
  { type: 'ObjectExpression' }
>['properties'][number];

const isValueProperty = (property: ObjectProperty | undefined): boolean =>
  property !== undefined &&
  property.type === 'Property' &&
  !property.computed &&
  property.key.type === 'Identifier' &&
  property.key.name === 'value';

const isValueBox = ({ parent, id, init }: VariableDeclarator): boolean => {
  if (parent.type !== 'VariableDeclaration' || parent.kind !== 'const') return false;
  if (id.type !== 'Identifier' || init?.type !== 'ObjectExpression') return false;
  if (init.properties.length !== 1) return false;
  const [property] = init.properties;
  return isValueProperty(property);
};

const assignedBoxName = (left: AssignmentTarget): string | undefined => {
  if (left.type !== 'MemberExpression' || left.computed) return undefined;
  if (left.object.type !== 'Identifier' || left.property.type !== 'Identifier') return undefined;
  return left.property.name === 'value' ? left.object.name : undefined;
};

const noValueBox: Rule = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow `const x = { value }` boxes that are mutated through `x.value = ...`.' },
    messages: {
      box: 'Do not wrap a single mutable value in `{ value }` to keep `const`. Use `let` inside the factory or presenter instead.',
    },
    schema: [],
  },
  create(context) {
    const boxes = new Map<string, VariableDeclarator>();
    const mutated = new Set<string>();
    return {
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier' && isValueBox(node)) boxes.set(node.id.name, node);
      },
      AssignmentExpression(node) {
        const name = assignedBoxName(node.left);
        if (name !== undefined) mutated.add(name);
      },
      'Program:exit'() {
        const reported = [...boxes].filter(([name]) => mutated.has(name));
        reported.forEach(([, node]) => context.report({ node, messageId: 'box' }));
      },
    };
  },
};

const plugin = {
  meta: { name: 'let-scope' },
  rules: {
    'no-top-level-let': noTopLevelLet,
    'no-value-box': noValueBox,
  },
};

export default plugin;
