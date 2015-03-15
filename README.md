# es6-module-goog

Transpiles es6 modules to goog modules.

# Why yet another transpiler

Both es6-module-transpiler and babel are good transpilers, however, at the time of testing, they did have a number
of breaking issues when used in combination with closure compiler:

- all comments need to be preserved to enable type checking (both transpilers seem to have issues with comments)
- es6 files should not be bundled (otherwise the @private check does not work)
- formatting and/or variable renaming makes the code difficult to debug because closure compiler is unable to use
  the transpilation sourcemaps, that is, the user is forced to debug the transpiled code instead of the es6 source.
Given the above and time pressures, it was decided to create this transpiler. Once closure compiler has native support
for es6 modules this module will become obsolete.

# Transpilation goals

- one to one mapping between es6 file and transpiled goog file (required by closure compiler directives such as @private)
- preserve comments and formatting (line/column formatting is preserved if first line in es6 file is empty or a comment, that is, sourcemaps are not required)
- imports are translated to goog.require, exports are translated to goog.provide (compatible with closure-library)
- es6 code is wrapped inside goog.scope (note that goog.scope puts some limitations on the supported es6 code)
- efficient build tool (follows dependencies and only transpiles changed es6 modules)
- easy integration in Makefile (print ordered list of dependent files)

# Install

npm install es6-module-goog --save-dev

# Command line usage

```
es6-module-goog options es6-entry
	- es6-entry: name of es6 entry file
	- options:
		-d, --depsFile <path>: filename of dependency JSON file, default: 'deps.json'
		-e, --es6Path <path>: directory with source files, default: 'src'
		-g, --googPath <path>: directory with transpiled files, default: 'goog'
		-p, --printPath <path>: print ordered dependency list for directory, default. 'goog'
		-n, --namespace <namespace>: prefix for all namespaces, default: 'app'
		-r, --replace <character>: string to replace invalid namespace characters with', default: '_'
```

# Makefile Usage

Simple include of Makefiles provided with es6-module-goog.

```
SHELL := /usr/local/bin/bash

.DELETE_ON_ERROR:
.PHONY: dist clean

# If required override Makefile variables used by es6-module-goog/Makefile.main.

include node_modules/es6-module-goog/Makefile.all
```

Or create a custom Makefile as illustrated by es6-module-goog Makefiles.

For example:

```
SHELL := /usr/local/bin/bash

.DELETE_ON_ERROR:

.PHONY: dist

dist: dist/index.js

dist/index.js: $(shell es6-module-goog src/index.js)
	# when es6-module-goog errors then error message is written to stderr, nothing is written to stdout, exit code is 1
	@[ -n '$^' ] && echo Compiling $@ from $^ && java -jar $(CLOSURE_COMPILER_JAR) $(CLOSURE_COMPILER_OPTIONS) $^ > $@
```

# Module usage

```
var ModuleDeps = require('../lib/ModuleDeps');

// Options object uses the keys and defaults defined by "Command line usage", e.g. depsFile: 'deps.json'
var moduleDeps = new ModuleDeps(/* Options object*/);

// when options.printPath is defined then an ordered list of files dependent on src/index.js with printed on stdout
moduleDeps.make('src/index.js);
```

# Pitfalls

- To preserve all lines/columns in the transpiled code, the first line of every es6-module should be empty or contain a comment
  because the transpiler will prefix the first line of the es6-module with goog.require's, goog.provide's and goog.scope.
- All es6 export and import statements are replaced by spaces and assignments to/from namespaces. Hence, the export's
  and import's will not be visible in the debugger.
- The es6 code is wrapped inside a goog.scope. Closure compiler threats variables defined in the goog.scope function
  as constants, that is, they can only be assigned once. This may cause unexpected closure compiler errors.

