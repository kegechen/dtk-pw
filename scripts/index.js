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

submodules = helper.getSubmodules();
console.log(submodules);
config = helper.buildSubmodules(submodules)
console.log(config);
// const submodules = readFileSync('./.gitmodules', 'utf-8');
// console.log(submodules);
// config = gitConfig.sync({ path: '.gitmodules' });
// console.log(config);
// console.log(Object.values(config));
