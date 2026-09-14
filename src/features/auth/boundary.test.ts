import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(__dirname, '../../..');
function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory()
      ? sources(file)
      : /\.tsx?$/.test(file) && !/\.test\./.test(file)
        ? [file]
        : [];
  });
}
const files = [
  ...sources(path.join(root, 'app/(auth)')),
  ...sources(__dirname).filter((file) => !file.includes(`${path.sep}integration${path.sep}`)),
];
test.each(files)(
  '%s has no transport, persistent state, timers, or direct asset dependency',
  (file) => {
    const source = fs.readFileSync(file, 'utf8');
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const dependencies: string[] = [];
    const calls: string[] = [];
    function visit(node: ts.Node) {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier))
        dependencies.push(node.moduleSpecifier.text);
      if (ts.isCallExpression(node)) calls.push(node.expression.getText(ast));
      ts.forEachChild(node, visit);
    }
    visit(ast);
    expect(dependencies.join('\n')).not.toMatch(
      /services|storage|query|axios|linking|\.png|providers|database|store\//i,
    );
    expect(calls.join('\n')).not.toMatch(
      /\bfetch\b|XMLHttpRequest|WebSocket|setInterval|setTimeout|useMutation|useQuery|setItem|token/i,
    );
    expect(source).not.toMatch(/useLocalSearchParams|useGlobalSearchParams|https?:\/\/|\bBearer\b/);
  },
);
test('navigation never embeds Authentication values in route parameters', () => {
  const screens = sources(path.join(__dirname, 'screens'))
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');
  expect(screens).not.toMatch(/(?:push|replace|navigate)\(\s*\{|params:|query:/);
});
