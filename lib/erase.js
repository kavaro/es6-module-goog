/**
 * Created by karl on 15/3/15.
 */

var spaces = require('./spaces');

function erase(begin, end) {
    return {
        begin: begin,
        end: end,
        value: spaces(end - begin)
    };
}

module.exports = erase;