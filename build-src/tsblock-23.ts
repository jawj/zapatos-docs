
        import * as xyz from 'zapatos/db';
        xyz.setConfig({
          queryListener: (x: any, txnId?: number) => {
            if (txnId != null) console.log('%%txnId%:' + txnId + '%%');
            console.log('%%text%:' + x.text + '%%');
            if (x.values.length) {
              console.log('%%values%:[' + x.values.map((v: any) => JSON.stringify(v)).join(', ') + ']%%');
            }
          },
          resultListener: (x: any, txnId?: number) => {
            if (false || (x != null && (false || !(Array.isArray(x) && x.length === 0)))) {
              if (txnId != null) console.log('%%txnId%:' + txnId + '%%');
              console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
            }
          },
          transactionListener: (x: any, txnId?: number) => {
            if (txnId != null) console.log('%%txnId%:' + txnId + '%%');
            console.log('%%transaction%:' + x + '%%');
          },
        });
        
          import * as db from 'zapatos/db';
          import { conditions as dc } from 'zapatos/db';
          import type * as s from 'zapatos/schema';
          import pool from './pgPool';
        
          try {
          /* original script begins */
          const
  d1 = db.toDate('2012-06-01T12:34:00Z'),  // TimestampTzString -> Date
  d2 = db.toDate('2012-06-01T00:00', 'local'),  // TimestampString (Europe/London) -> Date
  d3 = db.toDate('2012-06-01', 'UTC'),  // DateString (UTC) -> Date
  d4 = db.toDate(Math.random() < 0.5 ? null : '2012-10-09T02:34Z') // TimestampTzString | null -> Date | null;

console.log('d1:', d1, 'd2:', d2, 'd3:', d3, 'd4:', d4);

const
  s1 = db.toString(d1, 'timestamptz'),  // Date -> TimestampTzString
  s2 = db.toString(d2, 'timestamp:local'),  // Date -> TimestampString (Europe/London)
  s3 = db.toString(d3, 'date:UTC'),  // Date -> DateString (UTC)
  s4 = db.toString(Math.random() < 0.5 ? null : d4, 'timestamptz'); // Date | null -> TimestampTzString | null

console.log('s1:', s1, 's2:', s2, 's3:', s3, 's4:', s4);

          /* original script ends */
          } catch(e) {
            console.log(e.name + ': ' + e.message);
            console.error('  -> error: ' + e.message);
          }

          await pool.end();
          