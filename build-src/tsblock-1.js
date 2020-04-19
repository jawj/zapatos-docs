import * as xyz from './zapatos/src';
xyz.setConfig({
    queryListener: (x) => {
        console.log('<<<text>>>' + x.text + ';');
        if (x.values.length)
            console.log('<<<values>>>' + JSON.stringify(x.values, null, 2));
    },
    resultListener: (x) => {
        console.log('<<<result>>>' + JSON.stringify(x, null, 2));
    }
});
/* original script begins */
import * as db from './zapatos/src';
import { pool } from './pgPool';
const [doug, janey] = await db.insert('authors', [
    { name: 'Douglas Adams', isLiving: false },
    { name: 'Jane Austen', isLiving: false },
]).run(pool);
console.log(doug.id, janey.id);
/* original script ends */
pool.end();
