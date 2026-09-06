export async function createBranch(name: string): Promise<string> {
  return `branch:${name}`;
}

export async function commit(message: string, _files: string[]): Promise<{ success: boolean; hash: string }> {
  return { success: true, hash: Math.random().toString(16).slice(2, 42) };
}

export async function push(_remote: string, _branch: string): Promise<{ success: boolean }> {
  return { success: true };
}

export async function createPullRequest(title: string, _body: string): Promise<{ success: boolean; url: string }> {
  return { success: true, url: `https://github.com/microfyxd/pull/${Math.floor(Math.random() * 1000)}` };
}
