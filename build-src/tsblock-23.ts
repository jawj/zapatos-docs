
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
export const toDateTime = db.strict<db.DateString, DateTime>(DateTime.fromISO);
export const toDateString = db.strict((d: DateTime | Date | number) =>
  d instanceof DateTime ? d.toISO() as db.DateString : db.toDateString(d));

// db.strict handles null input both for type inference and at runtime
const dateStr = '1989-11-09T18:53:00.000+01:00' as db.DateString;
const dateStrOrNull = Math.random() < 0.5 ? dateStr : null;
const dt1 = toDateTime(null);  // dt1: null
const dt2 = toDateTime(dateStr);  // dt2: DateTime
const dt3 = toDateTime(dateStrOrNull);  // dt3: DateTime | null
const dateStr2 = toDateString(dt2);

console.log({ dt1, dt2, dt3, dateStr2 });
