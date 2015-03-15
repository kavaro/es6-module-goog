/**
 * Created by karl on 15/3/15.
 */

function spaces(count) {
    var str = '';
    while (count > 0) {
        str += ' ';
        count--;
    }
    return str;
}

module.exports = spaces;