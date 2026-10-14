import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  DEFAULT_BRANCH,
  REPOSITORIES,
  resolveMobileBuildOptions,
} = require('../scripts/download-mobile-build.js');

test('defaults to the intranet gitlab repository and the current release branch', () => {
  assert.deepEqual(resolveMobileBuildOptions([], {}), {
    source: 'gitlab',
    branch: DEFAULT_BRANCH,
    repoUrl: REPOSITORIES.gitlab,
  });
});

test('environment variables choose the source and branch', () => {
  assert.deepEqual(
    resolveMobileBuildOptions([], {
      MOBILE_BUILD_SOURCE: 'GitHub',
      MOBILE_BUILD_BRANCH: 'release/x',
    }),
    { source: 'github', branch: 'release/x', repoUrl: REPOSITORIES.github },
  );
});

test('legacy positional arguments still work when no environment is set', () => {
  assert.deepEqual(resolveMobileBuildOptions(['github', 'dev'], {}), {
    source: 'github',
    branch: 'dev',
    repoUrl: REPOSITORIES.github,
  });
});

test('environment wins over positional arguments', () => {
  assert.equal(
    resolveMobileBuildOptions(['github'], { MOBILE_BUILD_SOURCE: 'gitlab' })
      .source,
    'gitlab',
  );
});

test('an unknown source fails instead of silently falling back', () => {
  assert.throws(
    () => resolveMobileBuildOptions([], { MOBILE_BUILD_SOURCE: 'gitee' }),
    /MOBILE_BUILD_SOURCE/,
  );
});
