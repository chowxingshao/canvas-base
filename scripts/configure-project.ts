import { fileURLToPath } from 'node:url';
import { siteConfig } from '../site.config.ts';
import { configureProject } from './configure-project-lib.ts';

const branchIndex = process.argv.indexOf('--branch');
const branch = branchIndex === -1 ? undefined : process.argv[branchIndex + 1];
if (branchIndex !== -1 && !branch)
  throw new Error('Expected a branch after --branch.');
const root = fileURLToPath(new URL('../', import.meta.url));
const result = await configureProject({ root, config: siteConfig, branch });
console.log(JSON.stringify(result, null, 2));
