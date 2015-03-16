/**
 * Created by karl on 14/3/15.
 */

var extend = require('node.extend');
var Promise = require("bluebird");
var path = require('path');
var fs = require("fs-extra");
var readFile = Promise.promisify(fs.readFile);
var outputFile = Promise.promisify(fs.outputFile);
var readJson = Promise.promisify(fs.readJSON);
var outputJson = Promise.promisify(fs.outputJSON);
var removeFile = Promise.promisify(fs.remove);
var stat = Promise.promisify(fs.stat);
var compile = require('../lib/compile');

function ModuleDeps(options) {
    this.options = extend({
        es6Path: 'src',
        googPath: 'goog',
        printPath: 'goog',
        namespace: 'es6'
    }, options);
}

ModuleDeps.prototype.mtime = function (file) {
    return stat(file).then(function (stat) {
        return stat.mtime.getTime();
    }, function () {
        return -1;
    });
};

ModuleDeps.prototype.load = function (depsFile) {
    var self = this;
    return Promise.props({
        time: self.mtime(depsFile),
        deps: readJson(depsFile).then(function (deps) {
            return deps;
        }, function () {
            return {};
        })
    });
};

ModuleDeps.prototype.save = function (depsFile, deps) {
    return outputJson(depsFile, deps);
};

ModuleDeps.prototype.deps = function (deps, visited, file, ordered) {
    if (!visited[file]) {
        visited[file] = true;
        var depFiles = deps[file];
        if (depFiles) {
            depFiles.forEach(function (file) {
                this.deps(deps, visited, file, ordered);
            }, this);
        }
        ordered.push(file);
    }
};

ModuleDeps.prototype.compile = function (file, code, options) {
    return compile(file, code, options);
};

ModuleDeps.prototype.makeFile = function (depsTime, deps, visited, file) {
    if (!visited[file]) {
        visited[file] = true;
        var self = this;
        var es6File = path.join(self.options.es6Path, file);
        var googFile = path.join(self.options.googPath, file);
        return Promise
            .props({
                es6: self.mtime(es6File),
                goog: self.mtime(googFile)
            })
            .then(function (times) {
                if (times.es6 < 0) removeFile(googFile);
                else if (times.es6 > times.goog || times.es6 > depsTime) return readFile(es6File, 'utf8');
            })
            .then(function (code) {
                if (code) {
                    try {
                        return self.compile(file, code, self.options);
                    } catch(err) {
                        console.log(err.stack);
                        return new Promise(function(resolve, reject) {
                            var error = err.message;
                            error += ' in file "' + es6File + '"';
                            var loc = err.loc;
                            if (loc) error += ' at line: ' + loc.line + ', column: ' + loc.column;
                            reject(new Promise.OperationalError(error));
                        });
                    }
                }
            })
            .then(function (compiled) {
                if (compiled) {
                    deps[file] = compiled.deps;
                    return Promise.all([
                        outputFile(googFile, compiled.code),
                        self.makeFiles(depsTime, deps, visited, deps[file])
                    ]);
                }
            });
    }
};

ModuleDeps.prototype.makeFiles = function (depsTime, deps, visited, files) {
    var self = this;
    return Promise
        .all(files.map(function (file) {
            return self.makeFile(depsTime, deps, visited, file);
        })).then(function () {
            return deps;
        });
};

ModuleDeps.prototype.make = function (file) {
    var self = this;
    var depsFile = self.options.depsFile;
    return self.load(depsFile)
        .then(function (depsFile) {
            var files = [];
            depsFile.deps[file] ? self.deps(depsFile.deps, {}, file, files) : files.push(file);
            return self.makeFiles(depsFile.time, depsFile.deps, {}, files);
        })
        .then(function (deps) {
            return self.save(depsFile, deps).then(function () {
                return deps;
            });
        })
        .then(function (deps) {
            var ordered = [];
            self.deps(deps, {}, file, ordered);
            return Promise.all(ordered.map(function (file) {
                return stat(path.join(self.options.es6Path, file)).then(function () {
                    return file;
                }, function () {
                    var fromFiles = [];
                    for (var fromFile in deps) {
                        if (deps[fromFile].indexOf(file) >= 0) fromFiles.push('"' + fromFile + '"');
                    }
                    fromFiles = fromFiles.join(', ');
                    return new Promise(function (resolve, reject) {
                        var error = 'Unable to read file "' + file;
                        if (fromFiles.length) {
                            error += '" imported from ' + fromFiles;
                        }
                        reject(new Promise.OperationalError(error));
                    })
                });
            }));
        })
        .then(function (ordered) {
            var printPath = self.options.printPath;
            if (printPath) {
                console.log(ordered.map(function (file) {
                    return path.join(printPath, file);
                }).join(' '));
            }
        })
        .error(function (err) {
            console.error(err.message);
            process.exit(1);
        })
        .catch(function (err) {
            console.error(err);
            process.exit(1);
        })
};

module.exports = ModuleDeps;

