// sync-modules is used to sync submodules with meta.yml
// version in meta.yml must be a valid tag
// branch in meta.yml indicate the branch to track
// sync-modules will run if version or branch changes
// The logic is:
//      1. Use "version" as a tag to find a ref and fetch the exact tag sha
//      2. Check diff of meta.yml between base and head
//      3. Rebuild a ".gitmodules" using meta.yml from head
//      4. Add content of submodules according to its presence in base and head, removed submodule should be reset to null sha,
//         added submodule should be added with its commit sha
//      5. Create a tree using all of above contents
//      6. Create a commit using the tree
//      7. Update reference of head's branch to the new commit

const yaml = require('js-yaml');
// get pull request info
const {data: prInfo} = await github.rest.pulls.get({
  owner: context.repo.owner,
  repo: context.repo.repo,
  pull_number: context.issue.number
});
const getContent = async (sha) => {
  const {data: meta} = await github.rest.repos.getContent({
    owner: context.repo.owner,
    repo: context.repo.repo,
    path: 'meta.yml',
    ref: sha
  });
  return Buffer.from(meta.content, meta.encoding).toString('utf8');
};
// get specific file from commit
const baseContent = await getContent(prInfo.base.sha);
const headContent = await getContent(prInfo.head.sha);
const baseMetaInfo = yaml.load(baseContent);
const headMetaInfo = yaml.load(headContent);
baseRepos = baseMetaInfo['repos'];
console.log(baseRepos);
headRepos = headMetaInfo['repos'];
console.log(headRepos);
headTrackBranch = headMetaInfo.branch;
console.log(headTrackBranch);
let newRepos = [];
let deletedRepos = baseRepos;
console.log(deletedRepos);
for (let repo of headRepos) {
  if (baseRepos.includes(repo)) {
  // repo exists in both base and head, remove it from deletedRepos
    deletedRepos.splice(deletedRepos.indexOf(repo), 1);
  } else {
    newRepos.push(repo);
  }
}
console.log(deletedRepos);
console.log(newRepos);
// deleted repo's information and added repo's information can be posted together
// create new submodule config
submoduleConfig = {
  path: '.gitmodules',
  mode: '100644',
  type: 'blob'
};
submoduleContent = '';
const addSubmodule = async (repo, branch) => {
  const {data: repoInfo} = await github.rest.repos.get({
    owner: context.repo.owner,
    repo: repo
  });
  submoduleContent += `[submodule "${repo}"]\n`;
  submoduleContent += `\tpath = ${repo}\n`;
  submoduleContent += `\turl = ${repoInfo.clone_url}\n`;
  submoduleContent += `\tbranch = ${branch}\n`;
};

// everytime rebuild a new submodule config from meta.yml
// just build a .gitmodules from head repo
for (let repo of headRepos) {
  await addSubmodule(repo, headTrackBranch);
}
console.log(submoduleContent);
submoduleConfig.content = submoduleContent;
tree = [submoduleConfig];
for (let repo of deletedRepos) {
  deletedRepoInfo = {
    path: repo,
    mode: '160000',
    type: 'commit'
  };
  tree += deletedRepoInfo;
}
for (let repo of newRepos) {
  addedRepoInfo = {
    path: repo,
    mode: '160000',
    type: 'commit'
  };
  // get commit sha for repo branch
  const {data: commitInfo} = await github.rest.repos.getBranch({
    owner: context.repo.owner,
    repo: repo,
    branch: headTrackBranch
  });
  addedRepoInfo.sha = commitInfo.commit.sha;
  tree += addedRepoInfo;
}
console.log(tree);
// create a new tree
const {data: newTree} = await github.rest.git.createTree({
  owner: context.repo.owner,
  repo: context.repo.repo,
  tree: tree,
  base_tree: prInfo.base.sha
});
console.log(newTree);
// create a new commit using tree
const {data: newCommit} = await github.rest.git.createCommit({
  owner: context.repo.owner,
  repo: context.repo.repo,
  message: 'chore: sync repo modules',
  tree: newTree.sha,
  parents: [prInfo.base.sha]
});
console.log(newCommit);
// update reference
result = await github.rest.git.updateRef({
  owner: context.repo.owner,
  repo: context.repo.repo,
  ref: `heads/${prInfo.head.ref}`,
  sha: newCommit.sha
});
console.log(result);
