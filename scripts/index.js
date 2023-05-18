// Test helper
// const helper = require('./helper.js');
// helper.logWithHint('INFO', 'This is an info message');

// Test some modules
// const _ = require('lodash');
const { readFileSync } = require('fs');
// const ChangeLog = require(s'deb-changelog');
// const co = require('co');
const helper = require('./helper');
// co(function* () {
//     const changelogContent = readFileSync('./debian/changelog', 'utf-8');
//     var changelog = new ChangeLog(changelogContent);
//     var chunks = yield changelog.chunk();
//     console.log(_.first(chunks));
//     var re = /^((?<pkgname>\w[\w+\-\.]*)\s\((?<epoch>\d+:)?(?<version>[\w\d+-.]+)(?<revision>\~[\w\d+.]+)?(?<versionSuffix>(?:-[a-zA-Z\d+]+){0,})?(?<buildSuffix>\+[a-zA-Z\d+]+)?\)\s([^\;]+))\;\s([^\n\r]+)((\n\s{2,}.+)*)$/gm;
//     console.log(re.exec(_.first(chunks)));
// }).catch(function (err) {
//     console.log(err);
// });

let submodules = helper.getSubmodules();
console.log(submodules);
config = helper.buildSubmodules(submodules)
console.log(config);
// const submodules = readFileSync('./.gitmodules', 'utf-8');
// console.log(submodules);
// config = gitConfig.sync({ path: '.gitmodules' });
// console.log(config);
// console.log(Object.values(config));



const updateBranch = '${{ needs.read-meta.outputs.updateBranch }}';
const topicBranch = 'topic-update';
const repo = '${{ matrix.repo }}';
const version = '${{ needs.read-meta.outputs.version}}';
const { data: changelogBlob } = await github.rest.git.createBlob({
  owner: context.repo.owner,
  repo: repo,
  content: '${{ steps.generate_changelog.outputs.changelog }}',
  encoding: 'base64'
});
console.log(changelogBlob);
const changelog = {
  path: 'debian/changelog',
  mode: '100644',
  type: 'blob',
  sha: changelogBlob.sha
}
const identity = {
  name: '${{ github.event.pull_request.user.login }}',
  email: '${{ steps.get_email.outputs.email }}'
};
const {data: base} = await github.rest.repos.getBranch({
  owner: context.repo.owner,
  repo: repo,
  branch: updateBranch
});
const baseSha = base.commit.sha;
const {data: newTree} = await github.rest.git.createTree({
  owner: context.repo.owner,
  repo: repo,
  tree: [changelog],
  base_tree: baseSha
});
const {data: newCommit} = await github.rest.git.createCommit({
  owner: context.repo.owner,
  repo: repo,
  message: `chore: update changelog\n\nRelease ${version}.`,
  tree: newTree.sha,
  parents: [baseSha],
  committer: identity,
  author: identity
});
const {data: matchedRef} = await github.rest.git.listMatchingRefs({
  owner: context.repo.owner,
  repo: repo,
  ref: `heads/${topicBranch}`
});
console.log(matchedRef);
let exist = false;
for (let matched of matchedRef) {
  if (matched.ref == `refs/heads/${topicBranch}`) {
    exist = true;
    break;
  }
}
console.log("topic branch exist: ", exist);
console.log("topic branch: " + topicBranch + ", branch to update: " + updateBranch);
try {
  if (exist) {
    await github.rest.git.updateRef({
      owner: context.repo.owner,
      repo: repo,
      ref: `heads/${topicBranch}`,
      sha: newCommit.sha,
      force: true
    });
  } else {
    await github.rest.git.createRef({
      owner: context.repo.owner,
      repo: repo,
      ref: `heads/${topicBranch}`,
      sha: newCommit.sha
    });
  }
} catch (e) {
  console.log(e);
  core.setFailed(e.message);
}
// create pull request
const {data: prs} = await github.rest.pulls.list({
  owner: context.repo.owner,
  repo: repo,
  head: `${context.repo.owner}:${topicBranch}`,
  base: `${updateBranch}`
});
console.log("prs exist: ", prs);
if (prs.length == 0) {
  const { data: pr } = await github.rest.pulls.create({
    owner: context.repo.owner,
    repo: repo,
    title: 'chore: update changelog',
    body: `Release ${version}.`,
    head: topicBranch,
    base: updateBranch
  });
  console.log(pr);
}
