SHELL := /usr/local/bin/bash

.DELETE_ON_ERROR:
.PHONY: dist clean test cleantest

ES6_MODULE_GOOG := ../bin/es6-module-goog.js
CLOSURE_COMPILER_JAR := ../bower_components/closure-compiler/compiler.jar

test:
	@echo Clean
	@make -s clean
	@make -s install
	@make -s dist
	@echo Run
	@node dist/$(MAIN) > results/test.result
	@echo diff
	@diff results/test.result results/test.expected && echo "Success" || echo "Failed"

cleantest:
	@make -s clean
	@rm -f results/test.result
	@rm -f deps.json

include ../Makefile.vars ../Makefile.dist ../Makefile.closure_compiler ../Makefile.clean ../Makefile.install

