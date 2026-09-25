'use strict';
/** Original-source execution adapter; no full dependency or typecheck claim. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Module = require('node:module');
let ts;
try { ts = require('typescript'); }
catch { ts = require(process.env.TYPESCRIPT_PATH || '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const ROOT = process.env.OMNI_SOURCE_ROOT || path.join(__dirname, 'source');
const EXPECTED = {
  'consensus/parameter-aggregation.ts': '266f8c52ee5d4ff0c57c42e61a93b76c5136e613',
  'types/consensus.ts': '4e35d5f5885af7e7cfe7c59cd882cd28400df7c0',
  'consensus/weighted-voting.ts': '82424d8abc7441d2169bc257bf5550e9af1d4e86',
  'benchmarks/consensus-bench.ts': '3d56bd688d35da5a8dd21f020d98b6b595cffc20',
};
function readVerified(rel) {
  const buffer = fs.readFileSync(path.join(ROOT, rel));
  const hash = crypto.createHash('sha1').update(`blob ${buffer.length}\0`).update(buffer).digest('hex');
  if (hash !== EXPECTED[rel]) throw new Error(`Source identity mismatch: ${rel}: ${hash}`);
  return buffer.toString('utf8');
}
function transpile(content, filename) {
  const compiled = ts.transpileModule(content, {
    fileName: filename.replace(/\.cjs$/, ".ts"),
    compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS},
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  if (errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
    getCurrentDirectory:()=>__dirname, getNewLine:()=> '\n', getCanonicalFileName:x=>x,
  }));
  return compiled.outputText;
}
function evaluate(content, filename, resolveImport) {
  const mod = new Module(path.join(__dirname, filename));
  mod.filename = path.join(__dirname, filename);
  mod.paths = Module._nodeModulePaths(__dirname);
  mod.require = resolveImport;
  mod._compile(transpile(content, filename), mod.filename);
  return mod.exports;
}
const typeText = readVerified('types/consensus.ts');
const parsed = ts.createSourceFile('consensus.ts', typeText, ts.ScriptTarget.Latest, true);
const declarations = parsed.statements.filter(node =>
  (ts.isEnumDeclaration(node) && node.name.text === 'ConsensusMode') ||
  (ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(parsed) === 'DEFAULT_WEIGHTING_CONFIG'))
);
if (declarations.length !== 2) throw new Error('Expected exactly two original runtime declarations');
const types = evaluate(declarations.map(n=>n.getText(parsed)).join('\n'), 'extracted-types.cjs', spec=> {throw new Error(`Unexpected declaration import: ${spec}`);});
const weighted = evaluate(readVerified('consensus/weighted-voting.ts'), 'weighted-voting.cjs', spec=>{
  if (spec === '../types/index.js') return types;
  throw new Error(`Unapproved weighted-voting import: ${spec}`);
});
module.exports = { weighted, types, readVerified, evaluate, typescriptVersion:ts.version };
if (require.main === module) {
  if (process.argv[2] !== 'benchmark') throw new Error('Usage: node isolated-loader.cjs benchmark --output result.json');
  evaluate(readVerified('benchmarks/consensus-bench.ts'), 'consensus-bench.cjs', spec=>{
    if (spec === '../consensus/weighted-voting.js') return weighted;
    if (spec === '../types/index.js') return types;
    if (['node:fs/promises','node:path','node:perf_hooks'].includes(spec)) return require(spec);
    throw new Error(`Unapproved benchmark import: ${spec}`);
  });
}
