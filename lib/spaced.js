/**
 * Created by karl on 15/3/15.
 */

var spaces = require('./spaces');

function spaced(begin, end, value) {
    return {
        begin: begin,
        end: end,
        value: spaces(end - begin - value.length) + value
    }
}

module.exports = spaced;