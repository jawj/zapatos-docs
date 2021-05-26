
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
        import { DateTime } from 'luxon';
import * as db from 'zapatos/db';

// conversions to and from Luxon's DateTime
export const toDateTime = db.strict<db.TimestampTzString, DateTime>(DateTime.fromISO);
export const toTsTzString = db.strict((d: DateTime) => d.toISO() as db.TimestampTzString);

// db.strict handles null input both for type inference and at runtime
const tsTz = '1989-11-09T18:53:00.000+01:00' as db.TimestampTzString;
const tsTzOrNull = Math.random() < 0.5 ? tsTz : null;
const dt1 = toDateTime(null);  // dt1: null
const dt2 = toDateTime(tsTz);  // dt2: DateTime
const dt3 = toDateTime(tsTzOrNull);  // dt3: DateTime | null
const alsoTsTz = toTsTzString(dt2);

console.log({ dt1, dt2, dt3, alsoTsTz });
