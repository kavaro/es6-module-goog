/**
 * Created by karl on 8/3/15.
 */

import {App} from './sub/App';
import {trial} from 'trial';
import otherDefault from 'other';
import * as otherAll from 'other';
import 'include';

var app = new App('index');
app.print();
trial('index');
console.log(otherDefault, otherAll.default, otherAll.key);
