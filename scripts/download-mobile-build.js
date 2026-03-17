const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const source = args.includes('gitlab') ? 'gitlab' : 'github';
const BRANCH = args.find((a) => a !== 'gitlab' && a !== 'github') || 'dev';
const TARGET_DIR = 'unpackage/dist/build/web';

let REPO_URL = '';
if (source === 'gitlab') {
  REPO_URL =
    'https://git.yichamao.com/agent-platform/agent-platform-front-weapp.git';
} else {
  REPO_URL = 'https://github.com/nuwax-ai/nuwax-mobile.git';
}
const DIST_M_DIR = path.join(__dirname, '../dist/m');

// Helper to ensure directory exists
function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function downloadDirectory() {
  console.log(
    `📡 Fetching mobile build from ${REPO_URL}@${BRANCH}/${TARGET_DIR}...`,
  );
  ensureDirSync(DIST_M_DIR);

  try {
    // Check if git is available
    execSync('git --version', { stdio: 'ignore' });
  } catch (err) {
    console.error(
      '❌ Git is required to download the directory. Please install Git.',
    );
    process.exit(1);
  }

  // Use sparse-checkout to download just the specific directory we need
  const TEMP_DIR = path.join(__dirname, '../.tmp_mobile_build');

  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  try {
    console.log('🔄 Cloning repository (sparse checkout)...');

    // Create an empty repo
    execSync(
      `git clone --filter=blob:none --no-checkout --depth 1 -b ${BRANCH} ${REPO_URL} "${TEMP_DIR}"`,
      {
        cwd: __dirname,
        stdio: 'inherit',
      },
    );

    // Configure sparse checkout for the target directory
    execSync(`git sparse-checkout set "${TARGET_DIR}"`, {
      cwd: TEMP_DIR,
      stdio: 'inherit',
    });

    // Checkout the files
    execSync('git checkout', {
      cwd: TEMP_DIR,
      stdio: 'inherit',
    });

    // Move files to dist/m
    console.log('📦 Moving files to dist/m...');
    const sourcePath = path.join(TEMP_DIR, TARGET_DIR);

    if (!fs.existsSync(sourcePath)) {
      throw new Error(
        `Directory ${TARGET_DIR} not found in the repository branch ${BRANCH}.`,
      );
    }

    // A simple copy recursively
    function copyRecursiveSync(src, dest) {
      const exists = fs.existsSync(src);
      const stats = exists && fs.statSync(src);
      const isDirectory = exists && stats.isDirectory();
      if (isDirectory) {
        ensureDirSync(dest);
        fs.readdirSync(src).forEach((childItemName) => {
          copyRecursiveSync(
            path.join(src, childItemName),
            path.join(dest, childItemName),
          );
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    }

    copyRecursiveSync(sourcePath, DIST_M_DIR);

    console.log(
      '✅ Mobile build successfully downloaded and placed in dist/m/',
    );
  } catch (error) {
    console.error('❌ Error downloading mobile build:', error.message);
    process.exit(1);
  } finally {
    // Cleanup
    if (fs.existsSync(TEMP_DIR)) {
      console.log('🧹 Cleaning up temporary files...');
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  }
}

downloadDirectory();
