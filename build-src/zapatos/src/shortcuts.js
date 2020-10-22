/*
** DON'T EDIT THIS FILE (unless you're working on Zapatos) **
It's part of Zapatos, and will be overwritten when the database schema is regenerated

Zapatos: https://jawj.github.io/zapatos/
Copyright (C) 2020 George MacKerron
Released under the MIT licence: see LICENCE file
*/
import { all, SQLFragment, sql, cols, vals, raw, param, } from './core';
import { completeKeysWithDefault, mapWithSeparator, } from './utils';
;
function SQLForColumnsOfTable(columns, table) {
    return columns === undefined ? sql `to_jsonb(${table}.*)` :
        sql `jsonb_build_object(${mapWithSeparator(columns, sql `, `, c => sql `${param(c)}::text, ${c}`)})`;
}
function SQLForExtras(extras) {
    return extras === undefined ? [] :
        sql ` || jsonb_build_object(${mapWithSeparator(Object.keys(extras), sql `, `, k => sql `${param(k)}::text, ${extras[k]}`)})`;
}
/**
 * Generate an `INSERT` query `SQLFragment`.
 * @param table The table into which to insert
 * @param values The `Insertable` values (or array thereof) to be inserted
 */
export const insert = function (table, values, options) {
    let query;
    if (Array.isArray(values) && values.length === 0) {
        query = sql `INSERT INTO ${table} SELECT null WHERE false`;
        query.noop = true;
        query.noopResult = [];
    }
    else {
        const completedValues = Array.isArray(values) ? completeKeysWithDefault(values) : values, colsSQL = cols(Array.isArray(completedValues) ? completedValues[0] : completedValues), valuesSQL = Array.isArray(completedValues) ?
            mapWithSeparator(completedValues, sql `, `, v => sql `(${vals(v)})`) :
            sql `(${vals(completedValues)})`, returningSQL = SQLForColumnsOfTable(options === null || options === void 0 ? void 0 : options.returning, table), extrasSQL = SQLForExtras(options === null || options === void 0 ? void 0 : options.extras);
        query = sql `INSERT INTO ${table} (${colsSQL}) VALUES ${valuesSQL} RETURNING ${returningSQL}${extrasSQL} AS result`;
    }
    query.runResultTransform = Array.isArray(values) ?
        (qr) => qr.rows.map(r => r.result) :
        (qr) => qr.rows[0].result;
    return query;
};
/* === upsert === */
/**
 * Wraps a unique index of the target table for use as the arbiter constraint of an
 * `upsert` shortcut query.
 */
export class Constraint {
    constructor(value) {
        this.value = value;
    }
}
/**
 * Returns a `Constraint` instance, wrapping a unique index of the target table for
 * use as the arbiter constraint of an `upsert` shortcut query.
 */
export function constraint(x) { return new Constraint(x); }
/**
 * Generate an 'upsert' (`INSERT ... ON CONFLICT ...`) query `SQLFragment`.
 * @param table The table to update or insert into
 * @param values An `Insertable` of values (or an array thereof) to be inserted or updated
 * @param conflictTarget A `UNIQUE` index or `UNIQUE`-indexed column (or array thereof) that determines
 * whether this is an `UPDATE` (when there's a matching existing value) or an `INSERT`
 * (when there isn't)
 * @param noNullUpdateCols Optionally, a column (or array thereof) that should not be
 * overwritten with `NULL` values during an update
 */
export const upsert = function (table, values, conflictTarget, options) {
    var _a;
    if (Array.isArray(values) && values.length === 0)
        return insert(table, values); // punt a no-op to plain insert
    if (typeof conflictTarget === 'string')
        conflictTarget = [conflictTarget]; // now either Column[] or Constraint
    let noNullUpdateColumns = (_a = options === null || options === void 0 ? void 0 : options.noNullUpdateColumns) !== null && _a !== void 0 ? _a : [];
    if (!Array.isArray(noNullUpdateColumns))
        noNullUpdateColumns = [noNullUpdateColumns];
    const completedValues = Array.isArray(values) ? completeKeysWithDefault(values) : values, firstRow = Array.isArray(completedValues) ? completedValues[0] : completedValues, colsSQL = cols(firstRow), valuesSQL = Array.isArray(completedValues) ?
        mapWithSeparator(completedValues, sql `, `, v => sql `(${vals(v)})`) :
        sql `(${vals(completedValues)})`, colNames = Object.keys(firstRow), nonUniqueCols = Array.isArray(conflictTarget) ?
        colNames.filter(v => !conflictTarget.includes(v)) :
        colNames, uniqueColsSQL = Array.isArray(conflictTarget) ?
        sql `(${mapWithSeparator(conflictTarget.slice().sort(), sql `, `, c => c)})` :
        sql `ON CONSTRAINT ${conflictTarget.value}`, updateColsSQL = mapWithSeparator(nonUniqueCols.slice().sort(), sql `, `, c => c), updateValuesSQL = mapWithSeparator(nonUniqueCols.slice().sort(), sql `, `, c => noNullUpdateColumns.includes(c) ? sql `CASE WHEN EXCLUDED.${c} IS NULL THEN ${table}.${c} ELSE EXCLUDED.${c} END` : sql `EXCLUDED.${c}`), returningSQL = SQLForColumnsOfTable(options === null || options === void 0 ? void 0 : options.returning, table), extrasSQL = SQLForExtras(options === null || options === void 0 ? void 0 : options.extras);
    // the added-on $action = 'INSERT' | 'UPDATE' key takes after SQL Server's approach to MERGE
    // (and on the use of xmax for this purpose, see: https://stackoverflow.com/questions/39058213/postgresql-upsert-differentiate-inserted-and-updated-rows-using-system-columns-x)
    const query = sql `INSERT INTO ${table} (${colsSQL}) VALUES ${valuesSQL} ON CONFLICT ${uniqueColsSQL} DO UPDATE SET (${updateColsSQL}) = ROW(${updateValuesSQL}) RETURNING ${returningSQL}${extrasSQL} || jsonb_build_object('$action', CASE xmax WHEN 0 THEN 'INSERT' ELSE 'UPDATE' END) AS result`;
    query.runResultTransform = Array.isArray(completedValues) ?
        (qr) => qr.rows.map(r => r.result) :
        (qr) => qr.rows[0].result;
    return query;
};
/**
 * Generate an `UPDATE` query `SQLFragment`.
 * @param table The table to update
 * @param values An `Updatable` of the new values with which to update the table
 * @param where A `Whereable` (or `SQLFragment`) defining which rows to update
 */
export const update = function (table, values, where, options) {
    // note: the ROW() constructor below is required in Postgres 10+ if we're updating a single column
    // more info: https://www.postgresql-archive.org/Possible-regression-in-UPDATE-SET-lt-column-list-gt-lt-row-expression-gt-with-just-one-single-column0-td5989074.html
    const returningSQL = SQLForColumnsOfTable(options === null || options === void 0 ? void 0 : options.returning, table), extrasSQL = SQLForExtras(options === null || options === void 0 ? void 0 : options.extras), query = sql `UPDATE ${table} SET (${cols(values)}) = ROW(${vals(values)}) WHERE ${where} RETURNING ${returningSQL}${extrasSQL} AS result`;
    query.runResultTransform = (qr) => qr.rows.map(r => r.result);
    return query;
};
/**
 * Generate an `DELETE` query `SQLFragment` (sadly, plain 'delete' is a reserved word).
 * @param table The table to delete from
 * @param where A `Whereable` (or `SQLFragment`) defining which rows to delete
 */
export const deletes = function (table, where, options) {
    const returningSQL = SQLForColumnsOfTable(options === null || options === void 0 ? void 0 : options.returning, table), extrasSQL = SQLForExtras(options === null || options === void 0 ? void 0 : options.extras), query = sql `DELETE FROM ${table} WHERE ${where} RETURNING ${returningSQL}${extrasSQL} AS result`;
    query.runResultTransform = (qr) => qr.rows.map(r => r.result);
    return query;
};
/**
 * Generate a `TRUNCATE` query `SQLFragment`.
 * @param table The table (or array thereof) to truncate
 * @param opts Options: 'CONTINUE IDENTITY'/'RESTART IDENTITY' and/or 'RESTRICT'/'CASCADE'
 */
export const truncate = function (table, ...opts) {
    if (!Array.isArray(table))
        table = [table];
    const tables = mapWithSeparator(table, sql `, `, t => t), query = sql `TRUNCATE ${tables}${raw((opts.length ? ' ' : '') + opts.join(' '))}`;
    return query;
};
;
export var SelectResultMode;
(function (SelectResultMode) {
    SelectResultMode[SelectResultMode["Many"] = 0] = "Many";
    SelectResultMode[SelectResultMode["One"] = 1] = "One";
    SelectResultMode[SelectResultMode["ExactlyOne"] = 2] = "ExactlyOne";
    SelectResultMode[SelectResultMode["Count"] = 3] = "Count";
})(SelectResultMode || (SelectResultMode = {}));
export class NotExactlyOneError extends Error {
    constructor(query, ...params) {
        super(...params);
        if (Error.captureStackTrace)
            Error.captureStackTrace(this, NotExactlyOneError); // V8 only
        this.name = 'NotExactlyOneError';
        this.query = query; // custom property
    }
}
/**
 * Generate a `SELECT` query `SQLFragment`. This can be nested with other `select`/
 * `selectOne`/`count` queries using the `lateral` option.
 * @param table The table to select from
 * @param where A `Whereable` or `SQLFragment` defining the rows to be selected, or `all`
 * @param options Options object. Keys (all optional) are:
 * * `columns` — an array of column names: only these columns will be returned
 * * `order` – an array of `OrderSpec` objects, such as `{ by: 'column', direction: 'ASC'
 * }`
 * * `limit` and `offset` – numbers: apply this limit and offset to the query
 * * `lateral` — an object mapping key(s) to nested `select`/`selectOne`/`count` queries
 * to be `LATERAL JOIN`ed
 * * `alias` — table alias (string): required if using `lateral` to join a table to itself
 * * `extras` — an object mapping key(s) to `SQLFragment`s, so that derived
 * quantities can be included in the JSON result
 * @param mode Used internally by `selectOne` and `count`
 */
export const select = function (table, where = all, options = {}, mode = SelectResultMode.Many) {
    const limit1 = mode === SelectResultMode.One || mode === SelectResultMode.ExactlyOne, allOptions = limit1 ? Object.assign(Object.assign({}, options), { limit: 1 }) : options, alias = allOptions.alias || table, { distinct, groupBy, having, lateral, columns, extras } = allOptions, lock = allOptions.lock === undefined || Array.isArray(allOptions.lock) ? allOptions.lock : [allOptions.lock], order = allOptions.order === undefined || Array.isArray(allOptions.order) ? allOptions.order : [allOptions.order], tableAliasSQL = alias === table ? [] : sql ` AS ${alias}`, distinctSQL = !distinct ? [] : sql ` DISTINCT${distinct instanceof SQLFragment || typeof distinct === 'string' ? sql ` ON (${distinct})` :
        Array.isArray(distinct) ? sql ` ON (${cols(distinct)})` : []}`, colsSQL = mode === SelectResultMode.Count ?
        (columns ? sql `count(${cols(columns)})` : sql `count(${alias}.*)`) :
        SQLForColumnsOfTable(columns, alias), colsExtraSQL = SQLForExtras(extras), colsLateralSQL = lateral === undefined ? [] :
        sql ` || jsonb_build_object(${mapWithSeparator(Object.keys(lateral), sql `, `, (k, i) => sql `${param(k)}::text, "ljoin_${raw(String(i))}".result`)})`, allColsSQL = sql `${colsSQL}${colsExtraSQL}${colsLateralSQL}`, whereSQL = where === all ? [] : sql ` WHERE ${where}`, groupBySQL = !groupBy ? [] : sql ` GROUP BY ${groupBy instanceof SQLFragment || typeof groupBy === 'string' ? groupBy : cols(groupBy)}`, havingSQL = !having ? [] : sql ` HAVING ${having}`, orderSQL = order === undefined ? [] :
        sql ` ORDER BY ${mapWithSeparator(order, sql `, `, o => {
            if (!['ASC', 'DESC'].includes(o.direction))
                throw new Error(`Direction must be ASC/DESC, not '${o.direction}'`);
            if (o.nulls && !['FIRST', 'LAST'].includes(o.nulls))
                throw new Error(`Nulls must be FIRST/LAST/undefined, not '${o.nulls}'`);
            return sql `${o.by} ${raw(o.direction)}${o.nulls ? sql ` NULLS ${raw(o.nulls)}` : []}`;
        })}`, offsetSQL = allOptions.offset === undefined ? [] : sql ` OFFSET ${param(allOptions.offset)} ROWS`, limitSQL = allOptions.limit === undefined ? [] :
        sql ` FETCH FIRST ${param(allOptions.limit)} ROWS ${allOptions.withTies ? sql `WITH TIES` : sql `ONLY`}`, lockSQL = lock === undefined ? [] : lock.map(lock => {
        const ofTables = lock.of === undefined || Array.isArray(lock.of) ? lock.of : [lock.of], ofClause = ofTables === undefined ? [] : sql ` OF ${mapWithSeparator(ofTables, sql `, `, t => t)}`; // `as` clause is required when TS not strict
        return sql ` FOR ${raw(lock.for)}${ofClause}${lock.wait ? sql ` ${raw(lock.wait)}` : []}`;
    }), lateralSQL = lateral === undefined ? [] :
        Object.keys(lateral).map((k, i) => {
            const subQ = lateral[k];
            subQ.parentTable = alias; // enables `parent('column')` in subquery's Wherables
            return sql ` LEFT JOIN LATERAL (${subQ}) AS "ljoin_${raw(String(i))}" ON true`;
        });
    const rowsQuery = sql `SELECT${distinctSQL} ${allColsSQL} AS result FROM ${table}${tableAliasSQL}${lateralSQL}${whereSQL}${groupBySQL}${havingSQL}${orderSQL}${offsetSQL}${limitSQL}${lockSQL}`, query = mode !== SelectResultMode.Many ? rowsQuery :
        // we need the aggregate to sit in a sub-SELECT in order to keep ORDER and LIMIT working as usual
        sql `SELECT coalesce(jsonb_agg(result), '[]') AS result FROM (${rowsQuery}) AS ${raw(`"sq_${alias}"`)}`;
    query.runResultTransform =
        mode === SelectResultMode.Count ?
            // note: pg deliberately returns strings for int8 in case 64-bit numbers overflow
            // (see https://github.com/brianc/node-pg-types#use), but we assume our counts aren't that big
            (qr) => Number(qr.rows[0].result) :
            mode === SelectResultMode.ExactlyOne ?
                (qr) => {
                    var _a;
                    const result = (_a = qr.rows[0]) === null || _a === void 0 ? void 0 : _a.result;
                    if (result === undefined)
                        throw new NotExactlyOneError(query, 'One result expected but none returned (hint: check `.query.compile()` on this Error)');
                    return result;
                } : // SelectResultMode.One or SelectResultMode.Many
                (qr) => { var _a; return (_a = qr.rows[0]) === null || _a === void 0 ? void 0 : _a.result; };
    return query;
};
/**
 * Generate a `SELECT` query `SQLFragment` that returns only a single result (or
 * undefined). A `LIMIT 1` clause is added automatically. This can be nested with other
 * `select`/`selectOne`/`count` queries using the `lateral` option.
 * @param table The table to select from
 * @param where A `Whereable` or `SQLFragment` defining the rows to be selected, or `all`
 * @param options Options object. See documentation for `select` for details.
 */
export const selectOne = function (table, where, options = {}) {
    // you might argue that 'selectOne' offers little that you can't get with destructuring assignment 
    // and plain 'select' -- e.g. let [x] = async select(...).run(pool); -- but a thing that is definitely worth 
    // having is '| undefined' in the return signature, because the result of indexing never includes undefined
    // (see e.g. https://github.com/Microsoft/TypeScript/issues/13778)
    return select(table, where, options, SelectResultMode.One);
};
/**
 * Generate a `SELECT` query `SQLFragment` that returns a single result or throws an error.
 * A `LIMIT 1` clause is added automatically. This can be nested with other
 * `select`/`selectOne`/`count` queries using the `lateral` option.
 * @param table The table to select from
 * @param where A `Whereable` or `SQLFragment` defining the rows to be selected, or `all`
 * @param options Options object. See documentation for `select` for details.
 */
export const selectExactlyOne = function (table, where, options = {}) {
    return select(table, where, options, SelectResultMode.ExactlyOne);
};
/**
 * Generate a `SELECT` query `SQLFragment` that returns a count. This can be nested in
 * other `select`/`selectOne` queries using their `lateral` option.
 * @param table The table to count from
 * @param where A `Whereable` or `SQLFragment` defining the rows to be counted, or `all`
 * @param options Options object. Keys are: `columns`, `alias`.
 */
export const count = function (table, where, options) {
    return select(table, where, options, SelectResultMode.Count);
};
