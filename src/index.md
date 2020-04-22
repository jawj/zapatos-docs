
# Zapatos: _Zero-Abstraction Postgres for TypeScript_

## What does it do?

[Postgres](https://www.postgresql.org/) and [TypeScript](https://www.typescriptlang.org/) are independently awesome. Zapatos is a library that aims to make them awesome together. 

To achieve that, it does these five things:

* **Typescript schema** &nbsp; A command-line tool speaks to your Postgres database and writes up a TypeScript schema of detailed types for every table. This enables the following three things. [Show me »](#typescript-schema)

* **Arbitrary SQL** &nbsp; Simple building blocks help you write arbitrary SQL using [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates), and manually apply the right types to what goes in and what comes back. [Show me »](#arbitrary-sql)

* **Everyday CRUD** &nbsp; Shortcut functions produce everyday [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) queries with no fuss and no surprises, fully and automatically typed. [Show me »](#everyday-crud)

* **JOINs as nested JSON** &nbsp; Nested shortcut calls generate [LATERAL JOIN](https://www.postgresql.org/docs/12/queries-table-expressions.html#id-1.5.6.6.5.10.2) queries, resulting in arbitrarily complex nested JSON structures, still fully and automatically typed. [Show me »](#joins-as-nested-json)

* **Transactions** &nbsp; A transaction function helps with managing and retrying transactions. [Show me »](#transaction)


### Why does it do that?

It is a truth universally acknowledged that [ORMs aren't very good](https://en.wikipedia.org/wiki/Object-relational_impedance_mismatch). 

I like SQL, and Postgres especially. In my experience, abstractions that obscure the underlying SQL, or that prioritise ease of switching to another database tomorrow over effective use of _this_ database _today_, are a source of misery.

I've also come to love strongly typed languages, and TypeScript in particular. VS Code's type checking and autocomplete speed development, prevent bugs, and simplify refactoring. Especially when they _just happen_, they bring joy.

Zapatos aims to minimise the misery of abstraction, intensify the joy of type inference, and represent a credible alternative to traditional ORMs.


### How does that look?

#### Typescript schema

**A command-line tool speaks to your Postgres database and writes up a TypeScript schema of detailed types for every table.**

Take this ultra-simple SQL schema for a single table, `authors`:

```sql
CREATE TABLE "authors" 
( "id" SERIAL PRIMARY KEY
, "name" TEXT NOT NULL
, "isLiving" BOOLEAN );
```

We run `npx zapatos` to generate a file named `schema.ts`, including table definitions like this one:

```typescript:norun
export namespace authors {
  /* ... */
  export interface Selectable {
    id: number;
    name: string;
    isLiving: boolean | null;
  };
  export interface Insertable {
    id?: number | DefaultType | SQLFragment;
    name: string | SQLFragment;
    isLiving?: boolean | null | DefaultType | SQLFragment;
  };
  export interface Updatable extends Partial<Insertable> { };
  export type Whereable = { [K in keyof Insertable]?: 
    Exclude<Insertable[K] | ParentColumn, null | DefaultType> };
  /* ... */
}
```

The types are, I hope, pretty self-explanatory. `authors.Selectable` is what I'll get back from a `SELECT` query on this table. `authors.Insertable` is what I can `INSERT`: similar to the `Selectable`, but any fields that are `NULL`able and/or have `DEFAULT` values are allowed to be missing, `NULL` or `DEFAULT`. `authors.Updatable` is what I can `UPDATE` the table with: like what I can `INSERT`, but all columns are optional: it's a simple `Partial<authors.Insertable>`. `authors.Whereable`, finally, is what I can use in a `WHERE` condition 

`schema.ts` includes a few other types that get used internally, including some handy type mappings, such as this one:

```typescript:norun
export type SelectableForTable<T extends Table> = {
  authors: authors.Selectable,
  books: books.Selectable,
  tags: tags.Selectable,
  /* ... */
}[T];
```

[Tell me more about the command line tool »](#detail1)

#### Arbitrary SQL

**Simple building blocks help you write arbitrary SQL using [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates), and manually apply the right types to what goes in and what comes back.**

Let's insert something into that `authors` table for which we just generated the types. We'll write the SQL query ourselves, to show how that works (though we'll see an easier way [in the next section](#everyday-crud)):

```typescript
import * as db from './zapatos/src';
import * as s from './zapatos/schema';
import { pool } from './pgPool';

const
  author: s.authors.Insertable = {
    name: 'Gabriel Garcia Marquez',
    isLiving: false,
  },
  [insertedAuthor] = await db.sql<s.authors.SQL, s.authors.Selectable[]>`
      INSERT INTO ${"authors"} (${db.cols(author)})
      VALUES(${db.vals(author)}) RETURNING *`
    .run(pool);
```

We've applied the appropriate type to the object we're trying to insert (`s.authors.Insertable`), giving us type-checking and autocompletion on that object. And we've specified both which types are allowed as interpolated values in the template string (`s.authors.SQL`) and what type is going to be returned (`s.authors.Selectable[]`) when the query runs.

_You can click 'Explore types' above to open the code in an embedded Monaco (VS Code) editor, so you can check those typings for yourself._ 

[Tell me more about writing arbitrary SQL »](#detail2)


#### Everyday CRUD

**Shortcut functions produce everyday [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) queries with no fuss and no surprises, fully and automatically typed.**

So — writing SQL with Zapatos is nicer than constructing a query and all its input and output types from scratch. But for a totally bog-standard CRUD query like the `INSERT` above, it still involves quite a lot of boilerplate.

To eliminate the boilerplate, Zapatos supplies some simple functions to generate these sorts of queries, fully and automatically typed.

Let's use one of them — `insert` — to add two more authors:

```typescript
import * as db from './zapatos/src';
import { pool } from './pgPool';

const [doug, janey] = await db.insert('authors', [
  { name: 'Douglas Adams', isLiving: false },
  { name: 'Jane Austen', isLiving: false},
]).run(pool);
```

The `insert` shortcut accepts a single `Insertable` or an `Insertable[]` array, and correspondingly returns a single `Selectable` or a `Selectable[]` array. Since we specified `'authors'` as the first argument here, and an array as the second, input and output will be checked and auto-completed as `authors.Insertable[]` and `authors.Selectable[]` respectively.

_Again, click 'Explore types' to play around and check those typings._ 

In addition to `insert`, there are shortcuts for `select`, `selectOne` and `count`, and for `update`, `upsert`, `delete` and `truncate`. 

[Tell me more about the shortcut functions »](#detail2)


#### JOINs as nested JSON

**Nested shortcut calls generate [LATERAL JOIN](https://www.postgresql.org/docs/12/queries-table-expressions.html#id-1.5.6.6.5.10.2) queries, resulting in arbitrarily complex nested JSON structures, still fully and automatically typed.**

CRUD is our bread and butter, but the power of SQL is that it's _relational_ — it's in the `JOIN`s. And Postgres has some powerful JSON features that can deliver us sensibly-structured `JOIN` results without any post-processing (that's `json_agg`, `json_build_object`, and so on).

To demonstrate, let's say that `authors` have `books` and `books` have `tags`, adding two new tables to our simple schema:

```sql
CREATE TABLE "books" 
( "id" SERIAL PRIMARY KEY
, "authorId" INTEGER NOT NULL REFERENCES "authors"("id")
, "title" TEXT
, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now() );

CREATE TABLE "tags"
( "tag" TEXT NOT NULL
, "bookId" INTEGER NOT NULL REFERENCES "books"("id") );

CREATE UNIQUE INDEX "tagsUniqueIdx" ON "tags"("tag", "bookId");
```

Now, let's say I want to show a list of books, each with its (one) author and (many) associated tags. We could knock up a manual query for this, of course, but it gets quite hairy. The `select` shortcut has an option called `lateral` that can nest other `select` queries and do it for us. 

Let's try it:

```typescript
import * as db from './zapatos/src';
import { pool } from './pgPool';

const bookAuthorTags = await db.select('books', db.all, {
  lateral: {
    author: db.selectOne('authors', { id: db.parent('authorId') }),
    tags: db.select('tags', { bookId: db.parent('id') }),
  }
}).run(pool);

bookAuthorTags.map(b => 
  `${b.author!.name}: ${b.title} (${b.tags.map(t => t.tag).join(', ')})`);
```

This generates an efficient three-table `LATERAL JOIN` that returns a nested JSON structure directly from the database. Every nested element is again fully and automatically typed.

_Once again, the code above is in a Monaco (VS Code) editor, so you can play with it and and check that._ 

We can of course extend this to deeper nesting (e.g. query each author, with their books, with their tags); to self-joins (of a table with itself, e.g. employees to their managers in the same `employees` table); and to joins on relationships other than foreign keys (e.g. joining the nearest _N_ somethings using the PostGIS `<->` distance operator).

[Tell me more about nested select queries »](#detail2)


#### Transactions

**A transaction function helps with managing and retrying transactions.**

Transactions are where I've found traditional ORMs like TypeORM and Sequelize probably most footgun-prone. Zapatos is always explicit about what client or pool is running your query — hence the `pool` argument in all our examples so far. 

Zapatos also offers a simple `transaction` helper function that handles issuing a `ROLLBACK` on error, releasing the database client in a `finally` clause (i.e. whether or not an error was thrown), and automatically retrying queries in case of serialization failures. It looks like this:

```typescript:noresult
const result = db.transaction(pool, db.Isolation.Serializable, async txnClient => {
  /* queries here use txnClient instead of pool */
});
```

For example, take this `accounts` table:

```sql
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance > 0)
);
```

We can use the `transaction` helper like so:

```typescript
import * as db from './zapatos/src';
import { pool } from './pgPool';

const [accountA, accountB] = await db.insert('accounts', 
  [{ balance: 50 }, { balance: 50 }]).run(pool);

const transferMoney = (sendingAccountId: number, receivingAccountId: number, amount: number) =>
  db.transaction(pool, db.Isolation.Serializable, txnClient => Promise.all([
    db.update('accounts',
      { balance: db.sql<db.SQL>`${db.self} - ${db.param(amount)}` },
      { id: sendingAccountId }).run(txnClient),
    db.update('accounts',
      { balance: db.sql<db.SQL>`${db.self} + ${db.param(amount)}` },
      { id: receivingAccountId }).run(txnClient),
  ]));

try {
  const [updatedAccountA, updatedAccountB] = await transferMoney(accountA.id, accountB.id, 60);
} catch(err) {
  console.log(err.message, '/', err.detail);
}
```

Finally, it provides a set of hierarchical isolation types so that, for example, if you type a `txnClient` argument to a function as `TxnSatisfying.RepeatableRead`, you can call it with `Isolation.Serializable` or `Isolation.RepeatableRead` but not `Isolation.ReadCommitted`.


### What doesn't it do?

Zapatos doesn't handle schema migrations. Other tools can help you with this: check out [dbmate](https://github.com/amacneil/dbmate), for instance.

It doesn't manage the `pg` connection pool for you, as some ORMs do — mainly because this is so trivially easy. For example, my `pgPool.ts` looks something like this:

```typescript:norun
import pg from 'pg';
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
```

Finally, it won't tell you how to structure your code. Zapatos doesn't deal in the 'model' classes beloved of traditional ORMs, just (fully-typed) [POJOs](https://twitter.com/_ericelliott/status/831965087749533698?lang=en).


## How do I use it?

Zapatos provides a command line tool, which is run like so:
    
    npx zapatos

This generates the TypeScript schema for your database in a folder named `zapatos/schema.ts`, and copies (or symlinks) the Zapatos source files into `zapatos/src`. 

**You *must* import the Zapatos source files from this copied/symlinked `zapatos/src` directory, *not* `from 'zapatos'` in the usual way (which would find them in `node_modules`).**

That's because the source files depend on themselves importing your custom-generated `schema.ts`, which they cannot do if they're imported in the usual way.

Of course, before you can run `npx zapatos`, you need to install and configure it.

### Installation

Install it with `npm`:

    npm install --save-dev zapatos

If you are copying the source files, which is the recommended default, you can make the library a `devDependency` with `--save-dev` (conversely, if you are symlinking them, which is not recommended, you will need the library as a standard `dependency` with plain old `--save`).

### Configuration

Add a top-level file `zapatosconfig.json` to your project. Here's an example:

```json
{
  "db": {
    "connectionString": "postgresql://localhost/example_db"
  },
  "outDir": "./src",
  "schemas": {
    "public": {
      "include": "*",
      "exclude": ["excluded_table_1", "excluded_table_2"]
    }
  }
}
```

This file has up to four top-level keys:

* `"db"` gives Postgres connection details. You can provide [anything that you'd pass](https://node-postgres.com/features/connecting#Programmatic) to `new pg.Pool(/* ... */)` here. This key is required.

* `"outDir"` defines where your `zapatos` folder will be created, relative to the project root. If not specified, it defaults to the project root, i.e. `"."`.

* `"srcMode"` can take the values `"copy"` (the default) or `"symlink"`, determining whether `zapatos/src` will be a copy of the folder `node_modules/zapatos/src` or just a symlink to it. The symlink option can cause enormous headaches with tools like `ts-node` and `ts-jest`, which refuse to compile anything inside `node_modules`, and is not recommended.

* `"schemas"` is an object that lets you define schemas and tables to include and exclude. Each key is a schema name, and each value is an object with keys `"include"` and `"exclude"`. Those keys can take the values `"*"` (for all tables in schema) or an array of table names. The `"exclude"` list takes precedence over the `"include"` list.

  Note that schemas are not fully supported by Zapatos, since they are not included in the output types, but they will work by using Postgres's search path if none of your table names is duplicated across different schemas.

  If not specified, the default value for `"schemas"` includes all tables in the `public` schema, i.e.:

  ```json
  "schemas": {
    "public": {
      "include": "*",
      "exclude: []
    }
  }
  ```

  One more example: if you use PostGIS, you'll likely want to exclude its system tables:

  ```json
  "schemas": {
    "public": {
      "include": "*",
      "exclude": [
        "geography_columns", 
        "geometry_columns", 
        "raster_columns", 
        "raster_overviews", 
        "spatial_ref_sys"
      ]
    }
  }
  ```

#### Environment variables

All values in `zapatosconfig.json` can have environment variables (node.js's `process.env.SOMETHING`) interpolated via [handlebars](https://handlebarsjs.com/)-style doubly-curly-brackets `{{variables}}`. 

This is likely most useful for the database connection details. For example, on Heroku you'd probably configure your database as:

```json
"db": {
  "connectionString": "{{DATABASE_URL}}"
}
```

## Full documentation

### `sql` tagged template strings

Arbitrary queries are written using the tagged template function `sql`, which returns [`SQLFragment`](#sqlfragment) class instances.

The `sql` function is [generic](https://www.typescriptlang.org/docs/handbook/generics.html), having two type variables. For example: 

```typescript:noresult
const authorQuery = db.sql<s.authors.SQL, s.authors.Selectable[]>`
  SELECT * FROM ${"authors"}`;
```

The first type variable, `Interpolations`, defines allowable interpolation values. If we were joining the `authors` and `books` tables, say, then we could specify `s.authors.SQL | s.books.SQL` here.

The `Interpolations` type variable defaults to `db.SQL` if not specified. This is the union of all per-table `SQL` types, and thus allows all table and column names present in the database as string interpolations. However, TypeScript will infer a more specific type from the first interpolated value, and if you have multiple interpolated values of different types then you may need to specify a value explicitly (either `db.SQL` or something more precise).

The second type variable, `RunResult`, describes what will be returned if we call `run()` on the query (after any transformations performed in [`runResultTransform()`](#runresulttransform)), or if we embed it within the [`extras`](#extras) or [`lateral`](#lateral) query options. Its default value if not specified is `any[]`.

Take another example of these type variables:

```typescript:noresult
const [{ random }] = await db.sql<never, [{ random: number }]>`
  SELECT random()`.run(pool);
```

`Interpolations` is `never` because nothing needs to be interpolated in this query, and the `RunResult` type says that the query will return one row comprising one numeric column, named `random`. The `random` TypeScript variable we initialize will of course be typed as a `number`. 

If you're happy to have your types tied down a little less tightly, it also works to wholly omit the type variables in this query, falling back on their defaults:

```typescript:noresult
const [{ random }] = await db.sql`SELECT random()`.run(pool);
```

In this case, the `random` variable is of course still a `number`, but it is typed as `any`.


### `SQLFragment`

`SQLFragment<RunResult>` class instances are what is returned by the `sql` tagged template function — you're unlikely ever to contruct them directly with `new`. They take on the `RunResult` type variable from the `sql` template function that constructs them.

You can [interpolate them](#other-sql-template-strings) into other `sql` tagged template strings, or call/access the following properties on them:


#### `async run(queryable: Queryable): Promise<RunResult>`

The `run` function compiles, executes, and returns the transformed result of the query represented by this `SQLFragment`. The `awaited` return value is typed according to the `SQLFragment`'s `RunResult` type variable.

Taking that one step at a a time:

1. First, the `compile` function is called, recursively compiling this `SQLFragment` and its interpolated values into a `{ text: '', values: [] }` query that can be passed straight to the `pg` module. If a `queryListener` function [has been configured](#run-time-configuration), it is called with the query as its argument now.

2. Next, the compiled SQL query is executed against the supplied `Queryable`, which is defined as either a `pg.Pool` instance or a subtype of `pg.PoolClient` (`TxnClient`) as provided by the [`transaction` helper function](#transactions).

3. Finally, the result returned from `pg` is fed through this `SQLFragment`'s [`runResultTransform()`](#runresulttransform) function, whose default implementation simply returns the `rows` property of the result. If a `resultListener` function [has been configured](#run-time-configuration), it is called with the transformed result as its argument now.

Examples of the `run` function are scattered throughout this documentation.


#### `compile(): SQLQuery`

The `compile` function recursively transforms this `SQLFragment` and its interpolated values into a `SQLQuery` object (`{ text: string; values: any[]; }`) that can be passed straight to the `pg` module. It is called without arguments (the arguments it can take are for internal use).

For example:

```typescript
const 
  authorId = 12,  // from some untrusted source
  query = db.sql<s.books.SQL, s.books.Selectable[]>`
    SELECT * FROM ${"books"} WHERE ${{authorId}}`,
  compiled = query.compile();

console.log(compiled);
```

You may never need this function. Use it if and when you want to see the SQL that would be executed by the `run` function, without in fact executing it. 


#### `runResultTransform: (qr: pg.QueryResult) => any`

When you call `run`, the function stored in this property is applied to the result object returned by `pg`, in order to produce the result that's then returned by the function.

By default, the `rows` property (an array) is returned: the default implementation is just `qr => qr.rows`. However, the [shortcut functions](#shortcut-functions-and-lateral) supply their own `runResultTransform` implementations in order to match their declared `RunResult` types.

Generally you will not need to call this function directly, but there may be cases where you want to assign a new function to replace the default implementation.

For example, imagine we wanted to create a function returning a query that, when run, returns the current database timestamp directly as a `Date`. We could do so like this:

```typescript
function dbNowQuery() {
  const query = db.sql<never, Date>`SELECT now()`;
  query.runResultTransform = qr => qr.rows[0].now;
  return query;
}

const dbNow = await dbNowQuery().run(pool);
// dbNow is a Date: the result shown below has come via JSON.stringify
```

Note that the `RunResult` type variable on the `sql` template function (in this case, `Date`) reflects the type of the _transformed_ result, not what comes straight back from `pg` (which in this case is roughly `{ rows: [{ now: Date }] }`).

If a `SQLFragment` does not have `run` called on it directly — for example, if it is instead interpolated into another `SQLFragment`, or given as the value of the `lateral` option to the `select` shortcut — then the `runResultTransform` function is never applied.


### `sql` template interpolation types

#### Strings

The strings that can be directly interpolated into a `sql` template string are defined by its `Interpolations` type variable, [as noted above](#sql-tagged-template-strings). Typically, this will limit them to the names of tables and columns.

Interpolated strings are passed through to the raw SQL query double-quoted, to preserve capitalisation and neutralise SQL keywords, but otherwise unchanged. 

It's highly preferable to use interpolated string literals for table and column names rather than just writing those values in the query itself, in order to benefit from auto-completion and (ongoing) type-checking.

So, for example, do write:

```typescript:noresult
const title = await db.sql`
  SELECT ${"title"} FROM ${"books"} LIMIT 1`.run(pool);
```

But **don't** write

```typescript:noresult
const title = await db.sql`
  SELECT "title" FROM "books" LIMIT 1`.run(pool);  // no, don't do this!
```

— even though the two produce the same result right now.


#### `cols(): ColumnNames` and `vals(): ColumnValues`

The `cols` and `vals` wrapper functions (which return `ColumnNames` and `ColumnValues` class instances respectively) are designed primarily to help with `INSERT` queries.

Pass them each the same `Insertable` object: the `cols` are compiled to a comma-separated list of the column names, and the `vals` are compiled to a comma-separated list of SQL placeholders (`$1`, `$2`, ...) associated with the corresponding values in matching order. To return to an earlier example:

```typescript
const
  author: s.authors.Insertable = {
    name: 'Gabriel Garcia Marquez',
    isLiving: false,
  },
  [insertedAuthor] = await db.sql<s.authors.SQL, s.authors.Selectable[]>`
      INSERT INTO ${"authors"} (${db.cols(author)})
      VALUES(${db.vals(author)}) RETURNING *`
    .run(pool);
```

A second use for the `cols` function is in selecting only a subset of columns, in conjunction with the `OnlyCols` type. Pass an array of column names to `cols`, and they're compiled appropriately, as seen in this example:

```typescript
// the <const> prevents generalization to string[]
const bookCols = <const>['id', 'title'];
type BookDatum = s.books.OnlyCols<typeof bookCols>;

const
  bookData = await db.sql<s.books.SQL, BookDatum[]>`
    SELECT ${db.cols(bookCols)} FROM ${"books"}`.run(pool);
```

#### `sql` template strings




#### Arrays

Items in an interpolated array are treated just the same as if they had been interpolated directly. This can be useful in building queries programmatically. As a slightly contrived example:

```typescript
async function getBooksWhereAll(...conditions: db.SQLFragment[]) {
  for (let i = conditions.length - 1; i > 0; i--) {
    conditions.splice(i, 0, db.sql` AND `);
  }
  return db.sql<s.books.SQL, s.books.Selectable[]>`
    SELECT * FROM ${"books"} WHERE ${conditions}`.run(pool);
}

const books = await getBooksWhereAll(
  db.sql<s.books.SQL>`(${"title"} LIKE 'One%')`,
  db.sql<s.books.SQL>`(${"authorId"} = 12)`
);
```

#### `Whereable`

#### `self`

#### `param(value: any): Parameter`

#### `default`

#### `raw(value: string): DangerousRawString`

#### `parent(columnName: string): ParentColumn`

#### 


### Shortcut functions and lateral joins

#### insert

#### update

#### upsert

#### delete

#### truncate

#### select

##### extras

##### lateral



#### selectOne

#### count


### Transactions


### Run-time configuration


## Licence


<!--
What's happening here? First, we've applied the appropriate type to the object we're trying to insert: namely, `s.authors.Insertable`. This will give us type-checking and autocompletion on that object. 

Then we've used our [tagged template function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals), `db.sql`, to put together the query. We've specified both which types are allowed as interpolated values in the template string (`s.authors.SQL`) and what type is going to be returned (`s.authors.Selectable[]`) when the query runs.

Within the query, we've interpolated the table name, `${"authors"}`. Only the `authors` table and its column names are allowed as interpolated strings with `s.authors.SQL` specified, so it's hard to get that wrong. And we've used two helper functions, `db.cols` and `db.vals`, which split our `Insertable` into matching-ordered column names and (`$1`, `$2`, ... parameterized) values.

Finally, we've run the query using a specific `pg` client or pool, and accessed the newly inserted record's serial `id` value.
-->
<!--
Let's try one more raw SQL query, and search for the record we just inserted:

```typescript
import * as db from './zapatos/src';
import * as s from './zapatos/schema';
import { pool } from './pgPool';

const 
  searchPattern = '%marquez%',  // could be untrusted 
  [firstFoundAuthor] = await db.sql<s.authors.SQL, s.authors.Selectable[]>`
    SELECT * FROM ${"authors"} WHERE ${{
      isLiving: false,
      name: db.sql<db.SQL>`${db.self} ILIKE ${db.param(searchPattern)}`,
    }}`
  .run(pool);

console.log(firstFoundAuthor?.name);
```

Much of this is familiar. What's new is the object we've interpolated in our `WHERE` clause, an `s.authors.Wherable` that compiles to the conjunction of the given conditions. 

You'll notice that a `Whereable` can take either primitive values, which are simply tested for equality, or a `SQLFragment` (the return type of `db.sql`), in which case we can do whatever we want, using the symbol `db.self` to refer to the keyed column name.
-->

