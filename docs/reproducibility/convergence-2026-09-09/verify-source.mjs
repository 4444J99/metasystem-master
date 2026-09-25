import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const directory = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(directory,'source-identity.json'),'utf8'));
export const root = process.env.OMNI_REPOSITORY_ROOT;
if (!root) throw new Error('OMNI_REPOSITORY_ROOT must identify the verified repository materialization');
export const sourceRevision = process.env.SOURCE_REVISION;
if (sourceRevision !== manifest.source_revision) throw new Error('Exact committed source revision required');
for (const entry of manifest.files) {
  const bytes = fs.readFileSync(path.join(root,entry.path));
  const blob = crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  const digest = crypto.createHash('sha256').update(bytes).digest('hex');
  if (blob !== entry.git_blob_sha || digest !== entry.sha256) throw new Error(`Source identity mismatch: ${entry.path}`);
}
export const outputDirectory = process.env.OMNI_OUTPUT_DIRECTORY;
if (!outputDirectory) throw new Error('OMNI_OUTPUT_DIRECTORY required');
fs.mkdirSync(outputDirectory,{recursive:true});
