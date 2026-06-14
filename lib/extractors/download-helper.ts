import fs from 'fs';
import path from 'path';
import os from 'os';
import YTDlpWrap from 'yt-dlp-wrap';

const BINARY_DIR = os.tmpdir();
const BINARY_NAME = os.platform() === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const BINARY_PATH = path.join(BINARY_DIR, BINARY_NAME);

/**
 * Ensures that the yt-dlp binary is available in the temp folder.
 * If not present, downloads it from GitHub for the current platform.
 */
export async function getOrDownloadYtdlp(): Promise<string> {
  if (fs.existsSync(BINARY_PATH)) {
    return BINARY_PATH;
  }

  const platform = os.platform(); // 'win32', 'linux', 'darwin'
  let targetPlatform: 'win32' | 'linux' | 'darwin' = 'linux';

  if (platform === 'win32') {
    targetPlatform = 'win32';
  } else if (platform === 'darwin') {
    targetPlatform = 'darwin';
  }

  console.log(`yt-dlp binary not found. Downloading latest version for platform: ${targetPlatform}...`);

  // Download binary from Github
  await YTDlpWrap.downloadFromGithub(BINARY_PATH, 'latest', targetPlatform);

  // Set executable permissions on Unix systems
  if (platform !== 'win32') {
    try {
      fs.chmodSync(BINARY_PATH, 0o755);
      console.log('Successfully set executable permissions (0755) on yt-dlp binary.');
    } catch (chmodErr) {
      console.error('Failed to set executable permissions on yt-dlp binary:', chmodErr);
    }
  }

  console.log(`yt-dlp binary successfully prepared at: ${BINARY_PATH}`);
  return BINARY_PATH;
}
