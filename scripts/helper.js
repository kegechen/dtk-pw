
const { sync } = require('parse-git-config');
const helper = {
    logWithHint: function(hint, message) {
        console.log(hint);
        console.log(message);
    },
    getSubmodules: function() {
        const config = sync({ path: '.gitmodules', expandKeys: true });
        let submodules = [];
        const submoduleObject = config.submodule;
        if (!submoduleObject) {
            return submodules;
        }
        for (let property in submoduleObject) {
            let submodule = submoduleObject[property];
            submodule.name = property;
            submodules.push(submodule);
        }
        return submodules;
    },
    buildSubmodules: function(submodules) {
        let config = "";
        for (let submodule of submodules) {
            config += `[submodule "${submodule.name}"]\n`;
            config += `\tpath=${submodule.path}\n`;
            config += `\turl=${submodule.url}\n`;
            config += `\tbranch=${submodule.branch}\n`;
        }
        return config;
    }
}
module.exports=helper;
