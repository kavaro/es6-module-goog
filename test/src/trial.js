/**
 * Created by karl on 9/3/15.
 */

import {trial as subTrial} from 'sub/trial';

export var trial = function (calledFrom) {
    var text = 'trial';
    console.log('trial.js', calledFrom, text, subTrial());
    return text;
};
