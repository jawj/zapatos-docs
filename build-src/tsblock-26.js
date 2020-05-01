import * as xyz from './zapatos/src';
xyz.setConfig({
    queryListener: (x) => {
        console.log('%%text%:' + x.text + '%%');
        if (x.values.length) {
            console.log('%%values%:[' + x.values.map((v) => JSON.stringify(v)).join(', ') + ']%%');
        }
    },
    resultListener: (x) => {
        if (x && !(Array.isArray(x) && x.length === 0)) {
            console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
        }
    }
});
import { pool } from './pgPool';
/* original script begins */
export const allTables = [
    'appleTransactions',
    'authors',
    'bankAccounts',
    'books',
    'emailAuthentication',
    'employees',
    'stores',
    'tags',
];
/* original script ends */
pool.end();
