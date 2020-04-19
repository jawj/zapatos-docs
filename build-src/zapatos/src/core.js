/* tslint:disable */
import { getConfig } from './config';
// === symbols, types, wrapper classes and shortcuts ===
/**
 * Compiles to `DEFAULT` for use in `INSERT`/`UPDATE` queries.
 */
export const Default = Symbol('DEFAULT');
/**
 * Compiles to the current column name within a `Whereable`.
 */
export const self = Symbol('self');
/**
 * Signals all rows are to be returned (without filtering via a `WHERE` clause)
 */
export const all = Symbol('all');
/**
 * Compiles to a numbered query parameter (`$1`, `$2`, etc) and adds the wrapped value
 * at the appropriate position of the values array passed to pg
 */
export class Parameter {
    constructor(value) {
        this.value = value;
    }
}
/**
 * Returns a `Parameter` instance, which compiles to a numbered query parameter (`$1`,
 * `$2`, etc) and adds its wrapped value at the appropriate position of the values array
 * passed to pg
 */
export function param(x) { return new Parameter(x); }
/**
 * Compiles to the wrapped string value, as is. Dangerous: https://xkcd.com/327/.
 */
export class DangerousRawString {
    constructor(value) {
        this.value = value;
    }
}
/**
 * Returns a `DangerousRawString` instance, wrapping a string. `DangerousRawString`
 * compiles to the wrapped string value, as is. Dangerous: https://xkcd.com/327/.
 */
export function raw(x) { return new DangerousRawString(x); }
/**
 * Returns a `ColumnNames` instance, wrapping either an array or object. `ColumnNames`
 * compiles to a quoted, comma-separated list of array values (for use in a `SELECT`
 * query) or object keys (for use in an `INSERT`, `UDPATE` or `UPSERT` query, alongside
 * `ColumnValues`).
 */
export class ColumnNames {
    constructor(value) {
        this.value = value;
    }
}
/**
 * Returns a `ColumnNames` instance, wrapping either an array or an object. `ColumnNames`
 * compiles to a quoted, comma-separated list of array values (for use in a `SELECT`
 * query) or object keys (for use in an `INSERT`, `UDPATE` or `UPSERT` query alongside
 * a `ColumnValues`).
 */
export function cols(x) { return new ColumnNames(x); }
/**
 * Compiles to a quoted, comma-separated list of object keys for use in an `INSERT`,
 * `UPDATE` or `UPSERT` query, alongside `ColumnNames`.
 */
export class ColumnValues {
    constructor(value) {
        this.value = value;
    }
}
/**
 * Returns a ColumnValues instance, wrapping an object. ColumnValues compiles to a
 * quoted, comma-separated list of object keys for use in an INSERT, UPDATE or UPSERT
 * query alongside a `ColumnNames`.
 */
export function vals(x) { return new ColumnValues(x); }
/**
 * Compiles to the name of the column it wraps in the table of the parent query.
 * @param value The column name
 */
export class ParentColumn {
    constructor(value) {
        this.value = value;
    }
}
/**
 * Returns a `ParentColumn` instance, wrapping a column name, which compiles to that
 * column name of the table of the parent query.
 */
export function parent(x) { return new ParentColumn(x); }
/**
 * Tagged template function returning a `SQLFragment`. The first generic type argument
 * defines what interpolated value types are allowed. The second defines what type the
 * `SQLFragment` produces, where relevant (i.e. when calling `.run(...)` on it, or using
 * it as the value of an `extras` object).
 */
export function sql(literals, ...expressions) {
    return new SQLFragment(Array.prototype.slice.apply(literals), expressions);
}
export class SQLFragment {
    constructor(literals, expressions) {
        this.literals = literals;
        this.expressions = expressions;
        /**
         * When calling `run`, this function is applied to the object returned by `pg` to
         * produce the result that is returned. By default, the `rows` array is returned — i.e.
         * `(qr) => qr.rows` — but some shortcut functions alter this in order to match their
         * declared `RunResult` type.
         */
        this.runResultTransform = (qr) => qr.rows;
        this.parentTable = undefined; // used for nested shortcut select queries
    }
    /**
     * Compile and run this query using the provided database connection. What's returned
     * is piped via `runResultTransform` before being returned.
     * @param queryable A database client or pool
     */
    async run(queryable) {
        const query = this.compile(), config = getConfig();
        if (config.queryListener)
            config.queryListener(query);
        const qr = await queryable.query(query), result = this.runResultTransform(qr);
        if (config.resultListener)
            config.resultListener(result);
        return result;
    }
    /**
     * Compile this query, returning a `{ text: string, values: any[] }` object that could
     * be passed to the `pg` query function. Arguments are generally only passed when the
     * function calls itself recursively.
     */
    compile(result = { text: '', values: [] }, parentTable, currentColumn) {
        if (this.parentTable)
            parentTable = this.parentTable;
        result.text += this.literals[0];
        for (let i = 1, len = this.literals.length; i < len; i++) {
            this.compileExpression(this.expressions[i - 1], result, parentTable, currentColumn);
            result.text += this.literals[i];
        }
        return result;
    }
    compileExpression(expression, result = { text: '', values: [] }, parentTable, currentColumn) {
        if (this.parentTable)
            parentTable = this.parentTable;
        if (expression instanceof SQLFragment) {
            // another SQL fragment? recursively compile this one
            expression.compile(result, parentTable, currentColumn);
        }
        else if (typeof expression === 'string') {
            // if it's a string, it should be a x.Table or x.Columns type, so just needs quoting
            result.text += expression.charAt(0) === '"' ? expression : `"${expression}"`;
        }
        else if (expression instanceof DangerousRawString) {
            // Little Bobby Tables passes straight through ...
            result.text += expression.value;
        }
        else if (Array.isArray(expression)) {
            // an array's elements are compiled one by one -- note that an empty array can be used as a non-value
            for (let i = 0, len = expression.length; i < len; i++)
                this.compileExpression(expression[i], result, parentTable, currentColumn);
        }
        else if (expression instanceof Parameter) {
            // parameters become placeholders, and a corresponding entry in the values array
            result.values.push(expression.value);
            result.text += '$' + String(result.values.length); // 1-based indexing
        }
        else if (expression === Default) {
            // a column default
            result.text += 'DEFAULT';
        }
        else if (expression === self) {
            // alias to the latest column, if applicable
            if (!currentColumn)
                throw new Error(`The 'self' column alias has no meaning here`);
            result.text += `"${currentColumn}"`;
        }
        else if (expression instanceof ParentColumn) {
            // alias to the parent table (plus supplied column name) of a nested query, if applicable
            if (!parentTable)
                throw new Error(`The 'parent' table alias has no meaning here`);
            result.text += `"${parentTable}"."${expression.value}"`;
        }
        else if (expression instanceof ColumnNames) {
            // a ColumnNames-wrapped object -> quoted names in a repeatable order
            // or: a ColumnNames-wrapped array
            const columnNames = Array.isArray(expression.value) ? expression.value :
                Object.keys(expression.value).sort();
            result.text += columnNames.map(k => `"${k}"`).join(', ');
        }
        else if (expression instanceof ColumnValues) {
            // a ColumnValues-wrapped object -> values (in above order) are punted as SQL fragments or parameters
            const columnNames = Object.keys(expression.value).sort(), columnValues = columnNames.map(k => expression.value[k]);
            for (let i = 0, len = columnValues.length; i < len; i++) {
                const columnName = columnNames[i], columnValue = columnValues[i];
                if (i > 0)
                    result.text += ', ';
                if (columnValue instanceof SQLFragment || columnValue === Default)
                    this.compileExpression(columnValue, result, parentTable, columnName);
                else
                    this.compileExpression(new Parameter(columnValue), result, parentTable, columnName);
            }
        }
        else if (typeof expression === 'object') {
            // must be a Whereable object, so put together a WHERE clause
            const columnNames = Object.keys(expression).sort();
            if (columnNames.length) { // if the object is not empty
                result.text += '(';
                for (let i = 0, len = columnNames.length; i < len; i++) {
                    const columnName = columnNames[i], columnValue = expression[columnName];
                    if (i > 0)
                        result.text += ' AND ';
                    if (columnValue instanceof SQLFragment) {
                        result.text += '(';
                        this.compileExpression(columnValue, result, parentTable, columnName);
                        result.text += ')';
                    }
                    else {
                        result.text += `"${columnName}" = `;
                        this.compileExpression(columnValue instanceof ParentColumn ? columnValue : new Parameter(columnValue), result, parentTable, columnName);
                    }
                }
                result.text += ')';
            }
            else {
                // or if it is empty, it should always match
                result.text += 'TRUE';
            }
        }
        else {
            throw new Error(`Alien object while interpolating SQL: ${expression}`);
        }
    }
}
