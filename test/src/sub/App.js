/**
 * Created by karl on 8/3/15.
 */

import {trial} from '../trial';

class App {
    constructor(n) {
        this.name = n;
    }

    print() {
        console.log('sub/App.js', trial(this.name + '::print'));
    }
}

export {App};
