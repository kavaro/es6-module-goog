#!/usr/bin/env node

/**
 * Created by karl on 14/3/15.
 */

var path = require('path');
var options = require('commander');
var ModuleDeps = require('../lib/ModuleDeps');

options
    .version('0.0.1')
    .option('-d, --depsFile <path>', 'file to store dependencies', 'deps.json')
    .option('-e, --es6Path <path>', 'es6 directory', 'src')
    .option('-g, --googPath <path>', 'goog directory', 'goog')
    .option('-p, --printPath <path>', 'print ordered deps to stdout using path', 'goog')
    .option('-n, --namespace <namespace>', 'prepend this namespace to all computed namespaces', 'app')
    .option('-r, --replace <character>', 'string to replace invalid namespace characters with', '_')
    .parse(process.argv);

var moduleDeps = new ModuleDeps(options);
moduleDeps.make(path.relative(options.es6Path, options.args[0]));

