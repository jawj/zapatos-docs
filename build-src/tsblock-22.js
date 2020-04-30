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
import * as db from './zapatos/src';
import { pool } from './pgPool';
/* original script begins */
await db.update("emailAuthentication", {
    consecutiveFailedLogins: db.sql `${db.self} + 1`,
    lastFailedLogin: db.sql `now()`,
}, { email: 'me@privacy.net' }).run(pool);
/* original script ends */
pool.end();
