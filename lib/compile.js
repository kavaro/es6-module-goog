var Walker = require('node-source-walk');
var extend = require('node.extend');
var path = require('path');
var erase = require('./erase');
var spaced = require('./spaced');

/**
 * Convert es6 module import and export to goog.require, goog.provide and goog.scope
 *
 * @param  {String} file - Filename of file
 * @param  {String} code - File's content
 * @param  {Object} options
 * @return {Object} - deps: Array of filenames, code: compiled source code
 */
module.exports = function (file, code, options) {
    options = extend({
        resolve: function(file, importedFile) {
            if (importedFile[0] === '.') importedFile = path.relative(options.es6Path, path.resolve(path.dirname(path.resolve(options.es6Path, file)), importedFile));
            return importedFile;
        },
        namespace: ['ns'],
        replace: '_'
    }, options);
    var walker = new Walker({
        ecmaVersion: 6
    });

    if (typeof options.namespace !== 'function') {
        var namespace = (typeof options.namespace === 'string' ? options.namespace.split('.') : options.namespace).filter(function(ns) {
            return ns;
        });
        options.namespace = function(filename, options) {
            var ext = path.extname(filename);
            if (ext === '.js') filename = filename.slice(0, -ext.length);
            return namespace.concat(filename.split(path.sep).map(function (name) {
                return name.replace(/[^0-9a-zA-Z_\$\.]/g, options.replace);
            }));
        }
    }

    function getNamespace(name, isDep) {
        var filename = options.resolve(file, name, options);
        if (isDep) {
            if (path.extname(filename) !== '.js') filename += '.js';
            if (deps.indexOf(filename) === -1) deps.push(filename);
        }
        return options.namespace(filename, options);
    }

    var deps = [];
    var replacements = [];
    var googRequires = [];
    var googProvides = [getNamespace(file, false).join('.')];
    var googImports = [];
    var googExports = [];
    var exportDefault = false;

    walker.walk(code, function (node) {
        var name, namespace, baseNamespace;
        if (node.type === 'ImportDeclaration' && node.source && node.source.value) {
            baseNamespace = getNamespace(node.source.value, true);
            replacements.push(erase(node.start, node.end));
            if (node.specifiers.length) {
                node.specifiers.forEach(function (specifier) {
                    var name, namespace, prop;
                    if (specifier.id) {
                        name = specifier.name ? specifier.name.name : specifier.id.name;
                        prop = specifier.default ? 'default' : specifier.id.name;
                    } else {
                        name = specifier.name.name;
                        prop = 'default';
                    }
                    namespace = baseNamespace.concat([prop]).join('.');
                    googRequires.push(namespace);
                    googImports.push({
                        name: name,
                        namespace: namespace
                    })
                });
            } else {
                googRequires.push(baseNamespace.join('.'));
            }
        } else if (node.type === 'ExportDeclaration') {
            var declaration = node.declaration;
            baseNamespace = getNamespace(file);
            if (declaration) {
                switch (declaration.type) {
                    case 'ClassDeclaration':
                    case 'FunctionDeclaration':
                        replacements.push(erase(node.start, declaration.start));
                        name = declaration.id.name;
                        namespace = baseNamespace.concat([name]).join('.');
                        googProvides.push(namespace);
                        googExports.push({
                            name: name,
                            namespace: namespace
                        });
                        break;
                    case 'VariableDeclaration':
                        replacements.push(erase(node.start, declaration.start));
                        declaration.declarations.forEach(function (declarator) {
                            name = declarator.id.name;
                            namespace = baseNamespace.concat([name]).join('.');
                            googProvides.push(namespace);
                            googExports.push({
                                name: name,
                                namespace: namespace
                            })
                        });
                        break;
                    default:
                        replacements.push(spaced(node.start, declaration.start, exportDefault ? '$default = ' : 'var $default = '));
                        exportDefault = true;
                        name = 'default';
                        namespace = baseNamespace.concat([name]).join('.');
                        googProvides.push(namespace);
                        googExports.push({
                            name: '$default',
                            namespace: namespace
                        });
                        break;
                }
            } else if (node.specifiers) {
                replacements.push(erase(node.start, node.end));
                node.specifiers.forEach(function (specifier) {
                    name = specifier.id.name;
                    namespace = baseNamespace.concat([name]).join('.');
                    googProvides.push(namespace);
                    googExports.push({
                        name: name,
                        namespace: namespace
                    })
                });
            }
        }
    });

    replacements.reverse();
    replacements.forEach(function (replacement) {
        var before = code.slice(0, replacement.begin);
        var after = code.slice(replacement.end);
        code = before + replacement.value + after;
    });
    var modRequires = googRequires.map(function (namespace) {
        return 'goog.require("' + namespace + '");';
    }).join('');
    var modProvides = googProvides.map(function (namespace) {
        return 'goog.provide("' + namespace + '");';
    }).join('');
    var modImports = googImports.map(function (variable) {
        return 'var ' + variable.name + ' = ' + variable.namespace + ';'
    }).join('');
    var modExports = googExports.map(function (variable) {
        return variable.namespace + ' = ' + variable.name + ';'
    }).join('\n');
    return {
        deps: deps,
        code: [
            modRequires,
            modProvides,
            'goog.scope(function() {',
            modImports,
            code + '\n\n',
            modExports + '\n',
            '});\n'
        ].join('')
    }
};
