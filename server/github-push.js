import { getUncachableGitHubClient } from './github-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to push all files to GitHub
export async function pushToGitHub() {
  try {
    const octokit = await getUncachableGitHubClient();
    
    // Get repository info
    const owner = 'aussie33';
    const repo = 'SvcsJobboard';
    
    // Get the current commit SHA
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: 'heads/main'
    });
    
    const currentSha = ref.object.sha;
    
    // Get current commit to get the tree
    const { data: currentCommit } = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: currentSha
    });
    
    // Create blobs for all files
    const files = await getAllFiles(path.join(__dirname, '..'));
    const tree = [];
    
    for (const file of files) {
      const content = fs.readFileSync(file.path, 'utf8');
      const { data: blob } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: Buffer.from(content).toString('base64'),
        encoding: 'base64'
      });
      
      tree.push({
        path: file.relativePath,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
    }
    
    // Create new tree
    const { data: newTree } = await octokit.rest.git.createTree({
      owner,
      repo,
      tree,
      base_tree: currentCommit.tree.sha
    });
    
    // Create new commit
    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner,
      repo,
      message: 'Update Career Portal with bcrypt authentication fixes and comprehensive documentation',
      tree: newTree.sha,
      parents: [currentSha]
    });
    
    // Update reference
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: 'heads/main',
      sha: newCommit.sha
    });
    
    console.log('Successfully pushed to GitHub!');
    console.log('Commit SHA:', newCommit.sha);
    
    return {
      success: true,
      commitSha: newCommit.sha,
      message: 'Successfully pushed all files to GitHub repository'
    };
    
  } catch (error) {
    console.error('Error pushing to GitHub:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to get all files recursively
async function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    // Skip certain directories and files
    if (shouldSkip(item)) continue;
    
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      files.push({
        path: fullPath,
        relativePath
      });
    }
  }
  
  return files;
}

// Function to determine if a file/directory should be skipped
function shouldSkip(name) {
  const skipPatterns = [
    'node_modules',
    '.git',
    '.replit',
    'tmp',
    'logs',
    '.DS_Store',
    '*.log',
    'uploads',
    'attached_assets',
    '.env',
    '*.tar.gz',
    'career-portal-*',
    'deploy-*',
    'docker-*',
    'Dockerfile*',
    '*.sh',
    '*.cjs',
    'cookies.txt'
  ];
  
  return skipPatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(name);
    }
    return name === pattern || name.startsWith(pattern);
  });
}

// Run if called directly
if (process.argv[1] === __filename) {
  pushToGitHub().then(result => {
    console.log(result);
    process.exit(result.success ? 0 : 1);
  });
}