import { execSync } from 'child_process';
import { logger } from './logger';

interface DeploymentInfo {
  commitHash: string;
  commitMessage: string;
  deployedAt: string;
  nodeEnv: string | undefined;
}

let info: DeploymentInfo | null = null;

function getGitInfo(): { commitHash: string; commitMessage: string } {
  try {
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const commitMessage = execSync('git log -1 --format=%s', { encoding: 'utf8' }).trim();
    return { commitHash, commitMessage };
  } catch {
    return { commitHash: 'unknown', commitMessage: 'unknown' };
  }
}

export function getDeploymentInfo(): DeploymentInfo {
  if (!info) {
    const git = getGitInfo();
    info = {
      commitHash: git.commitHash,
      commitMessage: git.commitMessage,
      deployedAt: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
    };
    logger.info(`Deployment info: ${info.commitHash} — ${info.commitMessage}`);
  }
  return info;
}
