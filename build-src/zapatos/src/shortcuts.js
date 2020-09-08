/*
** DON'T EDIT THIS FILE (unless you're working on Zapatos) **
It's part of Zapatos, and will be overwritten when the database schema is regenerated

Zapatos: https://jawj.github.io/zapatos/
Copyright (C) 2020 George MacKerron
Released under the MIT licence: see LICENCE file
*/
import { all, SQLFragment, sql, cols, vals, raw, param, } from './core';
import { completeKeysWithDefault, mapWithSeparator } from './utils';
/**
 * Generate an `INSERT` query `SQLFragment`.
 * @param table The table into which to insert
 * @param values The `Insertable` values (or array thereof) to be inserted
 */
export const insert = function (table, values) {
    let query;
    if (Array.isArray(values) && values.length === 0) {
        query = sql `INSERT INTO ${table} SELECT null WHERE false`;
        query.noop = true;
        query.noopResult = [];
    }
    else {
        const completedValues = Array.isArray(values) ? completeKeysWithDefault(values) : values, colsSQL = cols(Array.isArray(completedValues) ? completedValues[0] : completedValues), valuesSQL = Array.isArray(completedValues) ?
            mapWithSeparator(completedValues, sql `, `, v => sql `(${vals(v)})`) :
            sql `(${vals(completedValues)})`;
        query = sql `INSERT INTO ${table} (${colsSQL}) VALUES ${valuesSQL} RETURNING to_jsonb(${table}.*) AS result`;
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
export const upsert = function (table, values, conflictTarget, noNullUpdateCols = []) {
    if (Array.isArray(values) && values.length === 0)
        return insert(table, values); // punt a no-op to plain insert
    if (typeof conflictTarget === 'string')
        conflictTarget = [conflictTarget]; // now either Column[] or Constraint
    if (!Array.isArray(noNullUpdateCols))
        noNullUpdateCols = [noNullUpdateCols];
    const completedValues = Array.isArray(values) ? completeKeysWithDefault(values) : values, firstRow = Array.isArray(completedValues) ? completedValues[0] : completedValues, colsSQL = cols(firstRow), valuesSQL = Array.isArray(completedValues) ?
        mapWithSeparator(completedValues, sql `, `, v => sql `(${vals(v)})`) :
        sql `(${vals(completedValues)})`, colNames = Object.keys(firstRow), nonUniqueCols = Array.isArray(conflictTarget) ?
        colNames.filter(v => !conflictTarget.includes(v)) :
        colNames, uniqueColsSQL = Array.isArray(conflictTarget) ?
        sql `(${mapWithSeparator(conflictTarget.slice().sort(), sql `, `, c => c)})` :
        sql `ON CONSTRAINT ${conflictTarget.value}`, updateColsSQL = mapWithSeparator(nonUniqueCols.slice().sort(), sql `, `, c => c), updateValuesSQL = mapWithSeparator(nonUniqueCols.slice().sort(), sql `, `, c => noNullUpdateCols.includes(c) ? sql `CASE WHEN EXCLUDED.${c} IS NULL THEN ${table}.${c} ELSE EXCLUDED.${c} END` : sql `EXCLUDED.${c}`);
    // the added-on $action = 'INSERT' | 'UPDATE' key takes after SQL Server's approach to MERGE
    // (and on the use of xmax for this purpose, see: https://stackoverflow.com/questions/39058213/postgresql-upsert-differentiate-inserted-and-updated-rows-using-system-columns-x)
    const query = sql `INSERT INTO ${table} (${colsSQL}) VALUES ${valuesSQL} ON CONFLICT ${uniqueColsSQL} DO UPDATE SET (${updateColsSQL}) = ROW(${updateValuesSQL}) RETURNING to_jsonb(${table}.*) || jsonb_build_object('$action', CASE xmax WHEN 0 THEN 'INSERT' ELSE 'UPDATE' END) AS result`;
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
export const update = function (table, values, where) {
    // note: the ROW() constructor below is required in Postgres 10+ if we're updating a single column
    // more info: https://www.postgresql-archive.org/Possible-regression-in-UPDATE-SET-lt-column-list-gt-lt-row-expression-gt-with-just-one-single-column0-td5989074.html
    const query = sql `UPDATE ${table} SET (${cols(values)}) = ROW(${vals(values)}) WHERE ${where} RETURNING to_jsonb(${table}.*) AS result`;
    query.runResultTransform = (qr) => qr.rows.map(r => r.result);
    return query;
};
/**
 * Generate an `DELETE` query `SQLFragment` (sadly, plain 'delete' is a reserved word).
 * @param table The table to delete from
 * @param where A `Whereable` (or `SQLFragment`) defining which rows to delete
 */
export const deletes = function (table, where) {
    const query = sql `DELETE FROM ${table} WHERE ${where} RETURNING to_jsonb(${table}.*) AS result`;
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
    const limit1 = mode === SelectResultMode.One || mode === SelectResultMode.ExactlyOne, allOptions = limit1 ? Object.assign(Object.assign({}, options), { limit: 1 }) : options, alias = allOptions.alias || table, { distinct, groupBy, having, lateral, extras } = allOptions, lock = allOptions.lock === undefined || Array.isArray(allOptions.lock) ? allOptions.lock : [allOptions.lock], tableAliasSQL = alias === table ? [] : sql ` AS ${alias}`, distinctSQL = !distinct ? [] : sql ` DISTINCT${distinct instanceof SQLFragment || typeof distinct === 'string' ? sql ` ON (${distinct})` :
        Array.isArray(distinct) ? sql ` ON (${cols(distinct)})` : []}`, colsSQL = mode === SelectResultMode.Count ?
        (allOptions.columns ? sql `count(${cols(allOptions.columns)})` : sql `count(${alias}.*)`) :
        allOptions.columns ?
            sql `jsonb_build_object(${mapWithSeparator(allOptions.columns, sql `, `, c => sql `${param(c)}::text, ${c}`)})` :
            sql `to_jsonb(${alias}.*)`, colsLateralSQL = lateral === undefined ? [] :
        sql ` || jsonb_build_object(${mapWithSeparator(Object.keys(lateral), sql `, `, (k, i) => sql `${param(k)}::text, "ljoin_${raw(String(i))}".result`)})`, colsExtraSQL = extras === undefined ? [] :
        sql ` || jsonb_build_object(${mapWithSeparator(Object.keys(extras), sql `, `, k => sql `${param(k)}::text, ${extras[k]}`)})`, allColsSQL = sql `${colsSQL}${colsLateralSQL}${colsExtraSQL}`, whereSQL = where === all ? [] : sql ` WHERE ${where}`, groupBySQL = !groupBy ? [] : sql ` GROUP BY ${groupBy instanceof SQLFragment || typeof groupBy === 'string' ? groupBy : cols(groupBy)}`, havingSQL = !having ? [] : sql ` HAVING ${having}`, orderSQL = !allOptions.order ? [] :
        sql ` ORDER BY ${mapWithSeparator(allOptions.order, sql `, `, o => {
            if (!['ASC', 'DESC'].includes(o.direction))
                throw new Error(`Direction must be ASC/DESC, not '${o.direction}'`);
            if (o.nulls && !['FIRST', 'LAST'].includes(o.nulls))
                throw new Error(`Nulls must be FIRST/LAST/undefined, not '${o.nulls}'`);
            return sql `${o.by} ${raw(o.direction)}${o.nulls ? sql ` NULLS ${raw(o.nulls)}` : []}`;
        })}`, limitSQL = allOptions.limit === undefined ? [] : sql ` LIMIT ${param(allOptions.limit)}`, offsetSQL = allOptions.offset === undefined ? [] : sql ` OFFSET ${param(allOptions.offset)}`, lockSQL = lock === undefined ? [] : lock.map(lock => {
        const ofTables = lock.of === undefined || Array.isArray(lock.of) ? lock.of : [lock.of], ofClause = ofTables === undefined ? [] : sql ` OF ${mapWithSeparator(ofTables, sql `, `, t => t)}`;
        return sql ` FOR ${raw(lock.for)}${ofClause}${lock.wait ? sql ` ${raw(lock.wait)}` : []}`;
    }), lateralSQL = lateral === undefined ? [] :
        Object.keys(lateral).map((k, i) => {
            const subQ = lateral[k];
            subQ.parentTable = alias; // enables `parent('column')` in subquery's Wherables
            return sql ` LEFT JOIN LATERAL (${subQ}) AS "ljoin_${raw(String(i))}" ON true`;
        });
    const rowsQuery = sql `SELECT${distinctSQL} ${allColsSQL} AS result FROM ${table}${tableAliasSQL}${lateralSQL}${whereSQL}${groupBySQL}${havingSQL}${orderSQL}${limitSQL}${offsetSQL}${lockSQL}`, query = mode !== SelectResultMode.Many ? rowsQuery :
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
                } :
                // SelectResultMode.One or SelectResultMode.Many
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
