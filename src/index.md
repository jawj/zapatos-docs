<div class="logos"><img class="pg-logo" src="pg.svg" width="43.2" height="44.5" alt="Postgres logo" /><img class="ts-logo" src="ts.svg" width="50.5" height="39" alt="TypeScript logo" /></div>

# <b>Zap<span class="extra-vowels a">a</span>t<span class="extra-vowels o">o</span>s:</b> <br><span style="font-weight: normal;">Zero-Abstraction Postgres for TypeScript</span>


[Postgres](https://www.postgresql.org/) and [TypeScript](https://www.typescriptlang.org/) are each, individually, fabulous. 

Zapatos aims to make them work beautifully together. No abstractions, no distractions: just your database, with type safety.


## What does it do?

To achieve this aim, Zapatos does these five things:

* **Typescript schema** &nbsp; A command-line tool speaks to your Postgres database and writes up a detailed TypeScript schema for every table. This is just a means to an end: it enables the next three things in this list. [Show me »](#typescript-schema)

* **Arbitrary SQL** &nbsp; Simple building blocks help you write arbitrary SQL using [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates), and manually apply the right types to what goes in and what comes back. [Show me »](#arbitrary-sql)

* **Everyday CRUD** &nbsp; Shortcut functions produce everyday [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) queries with no fuss and no surprises, fully and automatically typed. [Show me »](#everyday-crud)

* **JOINs as nested JSON** &nbsp; Nested shortcut calls generate [LATERAL JOIN](https://www.postgresql.org/docs/12/queries-table-expressions.html#id-1.5.6.6.5.10.2) queries, resulting in arbitrarily complex nested JSON structures, still fully and automatically typed. [Show me »](#joins-as-nested-json)

* **Transactions** &nbsp; A `transaction` function helps with managing and retrying transactions. [Show me »](#transactions)


### How does that look?

#### Typescript schema

**A command-line tool speaks to your Postgres database and writes up a detailed TypeScript schema for every table.**

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
  authors: authors.Selectable;
  books: books.Selectable;
  tags: tags.Selectable;
  /* ... */
}[T];
```

[Tell me more about the command line tool »](#how-do-i-use-it)

#### Arbitrary SQL

**Simple building blocks help you write arbitrary SQL using [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates), and manually apply the right types to what goes in and what comes back.**

Let's insert something into that `authors` table for which we just generated the types. We'll write the SQL query ourselves, to show how that works (though we'll see an easier way [in the next section](#everyday-crud)):

```typescript
const
  author: s.authors.Insertable = {
    name: 'Gabriel Garcia Marquez',
    isLiving: false,
  },
  [insertedAuthor] = await db.sql<s.authors.SQL, s.authors.Selectable[]>`
      INSERT INTO ${"authors"} (${db.cols(author)})
      VALUES (${db.vals(author)}) RETURNING *`
    .run(pool);
```

We apply the appropriate type to the object we're trying to insert (`s.authors.Insertable`), giving us type-checking and autocompletion on that object. And we specify both which types are allowed as interpolated values in the template string (`s.authors.SQL`) and what type is going to be returned (`s.authors.Selectable[]`) when the query runs.

We also use the [`cols` and `vals` helper functions](#cols-and-vals). These compile, respectively, to the object's keys (which are the column names) and query placeholders (`$1`, `$2`, ...) for the corresponding values. 

_You can click 'Explore types' above to open the code in an embedded Monaco (VS Code) editor, so you can check those typings for yourself._ 

[Tell me more about writing arbitrary SQL »](#sql-tagged-template-strings)


#### Everyday CRUD

**Shortcut functions produce everyday [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) queries with no fuss and no surprises, fully and automatically typed.**

So — writing SQL with Zapatos is nicer than constructing a query and all its input and output types from scratch. But for a totally bog-standard CRUD query like the `INSERT` above, it still involves quite a lot of boilerplate.

To eliminate the boilerplate, Zapatos supplies some simple functions to generate these sorts of queries, fully and automatically typed.

Let's use one of them — `insert` — to add two more authors:

```typescript
const [doug, janey] = await db.insert('authors', [
  { name: 'Douglas Adams', isLiving: false },
  { name: 'Jane Austen', isLiving: false},
]).run(pool);
```

The `insert` shortcut accepts a single `Insertable` or an `Insertable[]` array, and correspondingly returns a single `Selectable` or a `Selectable[]` array. Since we specified `'authors'` as the first argument here, and an array as the second, input and output will be checked and auto-completed as `authors.Insertable[]` and `authors.Selectable[]` respectively.

_Again, click 'Explore types' to play around and check those typings._ 

In addition to `insert`, there are shortcuts for `select`, `selectOne` and `count`, and for `update`, `upsert`, `delete` and `truncate`. 

[Tell me more about the shortcut functions »](#shortcut-functions-and-lateral-joins)


#### JOINs as nested JSON

**Nested shortcut calls generate [LATERAL JOIN](https://www.postgresql.org/docs/12/queries-table-expressions.html#id-1.5.6.6.5.10.2) queries, resulting in arbitrarily complex nested JSON structures, still fully and automatically typed.**

CRUD is our bread and butter, but the power of SQL is that it's _relational_ — it's in the `JOIN`s. And Postgres has some powerful JSON features that can deliver us sensibly-structured `JOIN` results with minimal post-processing (that's `json_agg`, `json_build_object`, and so on).

To demonstrate, let's say that `authors` have `books` and `books` have `tags`, adding two new tables to our simple schema:

```sql
CREATE TABLE "books" 
( "id" SERIAL PRIMARY KEY
, "authorId" INTEGER NOT NULL REFERENCES "authors"("id")
, "title" TEXT
, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now() );

CREATE TABLE "tags"
( "tag" TEXT NOT NULL
, "bookId" INTEGER NOT NULL REFERENCES "books"("id") ON DELETE CASCADE );

CREATE UNIQUE INDEX "tagsUniqueIdx" ON "tags"("tag", "bookId");
```

Now, let's say I want to show a list of books, each with its (one) author and (many) associated tags. We could knock up a manual query for this, of course, but [it gets quite hairy](#manual-joins-using-postgres-json-features). The `select` shortcut has an option called `lateral` that can nest other `select` queries and do it for us. 

Let's try it:

```typescript
const bookAuthorTags = await db.select('books', db.all, {
  lateral: {
    author: db.selectOne('authors', { id: db.parent('authorId') }),
    tags: db.select('tags', { bookId: db.parent('id') }),
  }
}).run(pool);
```

This generates an efficient three-table `LATERAL JOIN` that returns a nested JSON structure directly from the database. Every nested element is again fully and automatically typed.

_Again, you can click 'Explore types' above to open the code in an embedded Monaco (VS Code) editor, so you can check those typings for yourself._ 

We can of course extend this to deeper nesting (e.g. query each author, with their books, with their tags); to self-joins (of a table with itself, e.g. employees to their managers in the same `employees` table); and to joins on relationships other than foreign keys (e.g. joining the nearest _N_ somethings using the PostGIS `<->` distance operator).

[Tell me more about nested `select` queries »](#lateral-and-alias)


#### Transactions

**A `transaction` function helps with managing and retrying transactions.**

Transactions are where I've found traditional ORMs like TypeORM and Sequelize probably most footgun-prone. Zapatos is always explicit about what client or pool is running your query — hence the `pool` argument in all our examples so far. 

Zapatos also offers a simple `transaction` helper function that handles issuing a SQL `ROLLBACK` on error, releasing the database client in a TypeScript `finally` clause (i.e. whether or not an error was thrown), and automatically retrying queries in case of serialization failures. It looks like this:

```typescript:noresult
const result = await db.transaction(pool, db.Isolation.Serializable, async txnClient => {
  /* queries here use txnClient instead of pool */
});
```

For example, take this `bankAccounts` table:

```sql
CREATE TABLE "bankAccounts" 
( "id" SERIAL PRIMARY KEY
, "balance" INTEGER NOT NULL DEFAULT 0 CHECK ("balance" > 0) );
```

We can use the `transaction` helper like so:

```typescript
const [accountA, accountB] = await db.insert('bankAccounts', 
  [{ balance: 50 }, { balance: 50 }]).run(pool);

const transferMoney = (sendingAccountId: number, receivingAccountId: number, amount: number) =>
  db.transaction(pool, db.Isolation.Serializable, txnClient => Promise.all([
    db.update('bankAccounts',
      { balance: db.sql<db.SQL>`${db.self} - ${db.param(amount)}` },
      { id: sendingAccountId }).run(txnClient),
    db.update('bankAccounts',
      { balance: db.sql<db.SQL>`${db.self} + ${db.param(amount)}` },
      { id: receivingAccountId }).run(txnClient),
  ]));

try {
  const [[updatedAccountA], [updatedAccountB]] = await transferMoney(accountA.id, accountB.id, 60);
} catch(err) {
  console.log(err.message, '/', err.detail);
}
```

Finally, it provides a set of hierarchical isolation types so that, for example, if you type a `txnClient` argument to a function as `TxnSatisfying.RepeatableRead`, you can call it with `Isolation.Serializable` or `Isolation.RepeatableRead` but not `Isolation.ReadCommitted`.


### Why does it do those things?

It is a truth universally acknowledged that [ORMs aren't very good](https://en.wikipedia.org/wiki/Object-relational_impedance_mismatch). 

I like SQL, and Postgres especially. In my experience, abstractions that obscure the underlying SQL, or that prioritise ease of switching to another database tomorrow over effective use of _this_ database _today_, are a source of misery.

I've also come to love strongly typed languages, and TypeScript in particular. VS Code's type checking and autocomplete speed development, prevent bugs, and simplify refactoring. Especially when they _just happen_, they bring joy. But, traditionally, talking to the database is a place where they really don't _just happen_.

Zapatos aims to minimise the misery of abstraction, intensify the pleasures of type inference, and represent a credible alternative to traditional ORMs.


### What doesn't it do?

Zapatos doesn't handle schema migrations. Other tools can help you with this: check out [dbmate](https://github.com/amacneil/dbmate), for instance.

It also doesn't manage the connection pool for you, as some ORMs do — mainly because the `pg` module makes this so easy. For example, my `pgPool.ts` looks something like this:

```typescript:norun
import pg from 'pg';
export default new pg.Pool({ connectionString: process.env.DATABASE_URL });
```

Finally, it won't tell you how to structure your code: Zapatos doesn't deal in the 'model' classes beloved of traditional ORMs, just (fully-typed) [POJOs](https://twitter.com/_ericelliott/status/831965087749533698?lang=en).


## How do I use it?

Zapatos provides a command line tool, which is run like so:
    
    npx zapatos

This generates the TypeScript schema for your database in a folder named `zapatos/schema.ts`, and copies (or symlinks) the Zapatos source files into `zapatos/src`. 

**You *must* import the Zapatos source files from this copied/symlinked directory, e.g. `from './zapatos/src'` , and *not* `from 'zapatos'` in the usual way (which would find them in `node_modules`).**

That's because the source files depend on importing your custom, Zapatos-generated `schema.ts`, which they cannot do if they're imported direct from `node_modules` in the usual way.

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
  "srcMode": "copy",
  "progressListener": false,
  "warningListener": true,
  "schemas": {
    "public": {
      "include": "*",
      "exclude": ["excluded_table_1", "excluded_table_2"]
    }
  }
}
```

This file has up to six top-level keys:

* `"db"` gives Postgres connection details. You can provide [anything that you'd pass](https://node-postgres.com/features/connecting#Programmatic) to `new pg.Pool(/* ... */)` here. **This is the only required key.**

* `"outDir"` defines where your `zapatos` folder will be created, relative to the project root. If not specified, it defaults to the project root, i.e. `"."`.

* `"srcMode"` can take the values `"copy"` (the default) or `"symlink"`, determining whether `zapatos/src` will be a copy of the folder `node_modules/zapatos/src` or just a symlink to it. The symlink option can cause enormous headaches with tools like `ts-node` and `ts-jest`, which refuse to compile anything inside `node_modules`, and is not recommended.

* `"progressListener"` is a boolean that determines how chatty the tool is. If `true`, it enumerates its progress in generating the schema, copying files, and so on. It defaults to `false`.

* `"warningListener"` is a boolean that determines whether or not the tool logs a warning when an unknown Postgres type is converted to a TypeScript `any`. If `true`, which is the default, it does.

* `"schemas"` is an object that lets you define schemas and tables to include and exclude. Each key is a schema name, and each value is an object with keys `"include"` and `"exclude"`. Those keys can take the values `"*"` (for all tables in schema) or an array of table names. The `"exclude"` list takes precedence over the `"include"` list.

Note that schemas are not properly supported by Zapatos, since they are not included in the output types, but they can be made to work by using the Postgres [search path](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH) **if** all of your table names are unique across all schemas (to make this work, you'll need to run a query something like this: `ALTER DATABASE "mydb" SET "search_path" TO "$user", "public", "additionalSchema1", "additionalSchema2";`).

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

All values in `zapatosconfig.json` can have environment variables (Node's `process.env.SOMETHING`) interpolated via [handlebars](https://handlebarsjs.com/)-style doubly-curly-brackets `{{variables}}`. 

This is likely most useful for the database connection details. For example, on Heroku you'd probably configure your database as:

```json
"db": {
  "connectionString": "{{DATABASE_URL}}"
}
```

#### Programmatic generation

As an alternative to the command line tool, it's also possible to generate the schema and copy (or symlink) the source files programmatically. This is the only case when you _should_ import directly from `node_modules`. For example:

```typescript:norun
import * as z from 'zapatos';  // direct import in this case only

const zapCfg: z.Config = { db: { connectionString: 'postgres://localhost/mydb' } };
await z.generate(zapCfg);
```

Call the `generate` method with an object structured exactly the same as `zapatosconfig.json`, documented above. In this case the `progressListener` and `warningListener` keys can each take `true` or `false` (as in the JSON case) or a function with the signature `(s: string) => void`, which you can use to implement your own logging.

#### ESLint / tslint

One general configuration suggestion: set up [ESLint](https://github.com/typescript-eslint/typescript-eslint/blob/master/docs/getting-started/linting/README.md) with the rules [`@typescript-eslint/await-thenable`](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/await-thenable.md) and [`@typescript-eslint/no-floating-promises`](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-floating-promises.md) (or [tslint](https://palantir.github.io/tslint/) with [`no-floating-promises`](https://palantir.github.io/tslint/rules/no-floating-promises/) and [`await-promise`](https://palantir.github.io/tslint/rules/await-promise/)) to avoid `Promise`-related pitfalls.


## User guide


=> core.ts // === SQL tagged template strings ===

### `sql` tagged template strings

Arbitrary queries are written using the tagged template function `sql`, which returns [`SQLFragment`](#sqlfragment) class instances.

The `sql` function is [generic](https://www.typescriptlang.org/docs/handbook/generics.html), having two type variables. For example: 

```typescript
const authors = await db.sql<s.authors.SQL, s.authors.Selectable[]>`
  SELECT * FROM ${"authors"}`.run(pool);
```

The first type variable, `Interpolations` (above: `s.authors.SQL`), defines allowable interpolation values. If we were joining the `authors` and `books` tables, say, then we could specify `s.authors.SQL | s.books.SQL` here.

The `Interpolations` type variable defaults to `db.SQL` if not specified. This is the union of all per-table `SQL` types, and thus allows all table and column names present in the database as string interpolations. However, TypeScript will infer a more specific type from the first interpolated value, and if you have multiple interpolated values of different types then you may need to specify a value explicitly (either `db.SQL` or something more precise).

The second type variable, `RunResult` (above: `s.authors.Selectable[]`), describes what will be returned if we call `run()` on the query (after any transformations performed in [`runResultTransform()`](#runresulttransform-qr-pgqueryresult--any)), or if we embed it within the [`extras`](#extras) or [`lateral`](#lateral-and-alias) query options. Its default value if not specified is `any[]`.

Take another example of these type variables:

```typescript
const [{ random }] = await db.sql<never, [{ random: number }]>`
  SELECT random()`.run(pool);

console.log(random);
```

`Interpolations` is `never` because nothing needs to be interpolated in this query, and the `RunResult` type says that the query will return one row comprising one numeric column, named `random`. The `random` TypeScript variable we initialize will of course be typed as a `number`. 

If you're happy to have your types tied down a little less tightly, it also works to wholly omit the type variables in this particular query, falling back on their defaults:

```typescript:noresult
const [{ random }] = await db.sql`SELECT random()`.run(pool);
```

In this case, the `random` variable is of course still a `number`, but it is typed as `any`.


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
  SELECT "title" FROM "books" LIMIT 1`.run(pool);  // no, don't do this
```

— even if the two produce the same result right now.

More critically, **never** override the type-checking so as to write:

```typescript
const 
  nameSubmittedByUser = 'books"; DROP TABLE "authors"; --',
  title = await db.sql<any>`
    SELECT * FROM ${nameSubmittedByUser} LIMIT 1`.run(pool);  // NEVER do this!
```

If you override type-checking to pass untrusted data to Zapatos in unexpected places, such as the above use of `any`, you can expect successful SQL injection attacks. (It *is* safe to pass untrusted data as values in `Whereable`, `Insertable`, and `Updatable` objects, manually by using [`param`](#paramvalue-any-parameter), and in certain other places. If you're in any doubt, check whether the generated SQL is using `$1`, `$2`, ... parameters).


#### `cols()` and `vals()`

The `cols` and `vals` wrapper functions (which return `ColumnNames` and `ColumnValues` class instances respectively) are intended to help with certain `INSERT` and `SELECT` queries.

In the `INSERT` context, pass them each the same `Insertable` object: `cols` is compiled to a comma-separated list of the object's keys, which are the column names, and `vals` is compiled to a comma-separated list of SQL placeholders (`$1`, `$2`, ...) associated with the corresponding values, in matching order. To return to (approximately) an earlier example:

```typescript
const
  author: s.authors.Insertable = {
    name: 'Joseph Conrad',
    isLiving: false,
  },
  [insertedAuthor] = await db.sql<s.authors.SQL, s.authors.Selectable[]>`
    INSERT INTO ${"authors"} (${db.cols(author)})
    VALUES (${db.vals(author)}) RETURNING *`.run(pool);
```

The `cols` and `vals` wrappers can also each take an array instead of an object.

For the `cols` function, this can help us select only a subset of columns, in conjunction with the `OnlyCols` type. Pass an array of column names to `cols` to have them compiled appropriately, as seen in this example:

```typescript
// the <const> prevents generalization to string[]
const bookCols = <const>['id', 'title'];
type BookDatum = s.books.OnlyCols<typeof bookCols>;

const
  bookData = await db.sql<s.books.SQL, BookDatum[]>`
    SELECT ${db.cols(bookCols)} FROM ${"books"}`.run(pool);
```

For the `vals` function, this can help with `IN (...)` queries, such as the following:

```typescript
const 
  authorIds = [1, 2, 123],
  authors = await db.sql<s.authors.SQL, s.authors.Selectable[]>` 
    SELECT * FROM ${"authors"} WHERE ${"id"} IN (${db.vals(authorIds)})`.run(pool);
```


#### `Whereable`

Any plain JavaScript object interpolated into a `sql` template string is type-checked as a `Whereable`, and compiled into one or more conditions joined with `AND` (but, for flexibility, no `WHERE`). The object's keys represent column names, and the corresponding values are compiled as (injection-safe) parameters.

For example:

```typescript
const 
  title = 'Northern Lights',
  books = await db.sql<s.books.SQL, s.books.Selectable[]>`
    SELECT * FROM ${"books"} WHERE ${{ title }}`.run(pool);
```

A `Whereable`'s values can also be `SQLFragments`, however, and this makes them extremely flexible. In a `SQLFragment` inside a `Whereable`, the special symbol `self` can be used to refer to the column name. This arrangement enables us to use any operator or function we want — not just `=`.

For example:

```typescript
const 
  titleLike = `Northern%`,
  books = await db.sql<s.books.SQL, s.books.Selectable[]>`
    SELECT * FROM ${"books"} WHERE ${{ 
      title: db.sql<db.SQL>`${db.self} LIKE ${db.param(titleLike)}`,
      createdAt: db.sql<db.SQL>`${db.self} > now() - INTERVAL '7 days'`,
    }}`.run(pool);
```

#### `self`

The use of the `self` symbol is explained in [the section on `Whereable`s](#whereable).


#### `param(value: any): Parameter`

In general, Zapatos' type-checking won't let us [pass user-supplied data unsafely into a query](https://xkcd.com/327/) by accident. The `param` wrapper function exists to enable the safe passing of user-supplied data into a query using numbered query parameters (`$1`, `$2`, ...). 

For example:

```typescript
const 
  title = 'Pride and Prejudice',
  books = await db.sql<s.books.SQL, s.books.Selectable[]>`
    SELECT * FROM ${"books"} WHERE ${"title"} = ${db.param(title)}`.run(pool);
```

This same mechanism is applied automatically when we use [a `Whereable` object](#whereable) (and in this example, using a `Whereable` would be more readable and more concise). It's also applied when we use [the `vals` function](#cols-and-vals) to create a `ColumnValues` wrapper object.


#### `default`

The `default` symbol simply compiles to the SQL `DEFAULT` keyword. This may be useful in `INSERT` and `UPDATE` queries where no value is supplied for one or more of the affected columns.


#### `sql` template strings

`sql` template strings (resulting in `SQLFragment`s) can be interpolated within other `sql` template strings (`SQLFragment`s). This provides flexibility in building queries programmatically.

For example, the [`select` shortcut](#select-selectone-selectexactlyone-and-count) makes extensive use of nested `sql` templates to build its queries:
 
```typescript:norun
const
  rowsQuery = sql<SQL, any>`
    SELECT ${allColsSQL} AS result 
    FROM ${table}${tableAliasSQL}
    ${lateralSQL}${whereSQL}${orderSQL}${limitSQL}${offsetSQL}`,

  // we need the aggregate function, if one's needed, to sit in an outer 
  // query, to keep ORDER and LIMIT working normally in the main query
  query = mode !== SelectResultMode.Many ? rowsQuery :
    sql<SQL, any>`
      SELECT coalesce(jsonb_agg(result), '[]') AS result 
      FROM (${rowsQuery}) AS ${raw(`"sq_${aliasedTable}"`)}`;
```

#### Arrays

Items in an interpolated array are treated just the same as if they had been interpolated directly. This, again, can be useful for building queries programmatically.

To take the [`select` shortcut](#select-selectone-selectexactlyone-and-count) as our example again, an interpolated array is used to generate `LATERAL JOIN` query elements from the `lateral` option, like so:

```typescript:norun
const
  lateralOpt = allOptions.lateral,
  lateralSQL = lateralOpt === undefined ? [] :
    Object.keys(lateralOpt).map(k => {
      const subQ = lateralOpt[k];
      subQ.parentTable = aliasedTable;  // enables `parent()` in subquery's Wherables
      return sql<SQL>` LEFT JOIN LATERAL (${subQ}) AS ${raw(`"cj_${k}"`)} ON true`;
    });
```

The `lateralSQL` variable — a `SQLFragment[]` — is subsequently interpolated into the final query (some additional SQL using `jsonb_build_object()` is interpolated earlier in that query, to return the result of the lateral subquery alongside the main query columns).

Note that a useful idiom also seen here is the use of the empty array (`[]`) to conditionally interpolate nothing at all.


#### `raw(value: string): DangerousRawString`

The `raw` function returns `DangerousRawString` wrapper instances. This represents an escape hatch, enabling us to interpolate arbitrary strings into queries in contexts where the `param` wrapper is unsuitable (such as when we're interpolating basic SQL syntax elements). **If you pass user-controlled data to this function you will open yourself up to SQL injection attacks.**


#### `parent(columnName: string): ParentColumn`

Within `select`, `selectOne` or `count` queries passed as subqueries to the `lateral` option of `select` or `selectOne`, the `parent()` wrapper can be used to refer to a column of the table that's the subject of the immediately containing query. For details, see the [documentation for the `lateral` option](#lateral-and-alias).


### `SQLFragment`

`SQLFragment<RunResult>` class instances are what is returned by the `sql` tagged template function — you're unlikely ever to contruct them directly with `new`. They take on the `RunResult` type variable from the `sql` template function that constructs them.

You can [interpolate them](#sql-template-strings) into other `sql` tagged template strings, or call/access the following properties on them:


=> core.ts run = async (queryable: Queryable, force = false): Promise<RunResult> => {

#### `async run(queryable: Queryable, force = false): Promise<RunResult>`

The `run` function compiles, executes, and returns the transformed result of the query represented by this `SQLFragment`. The `awaited` return value is typed according to the `SQLFragment`'s `RunResult` type variable.

Taking that one step at a time:

1. First, [the `compile` function](#compile-sqlquery) is called, recursively compiling this `SQLFragment` and its interpolated values into a `{ text: '', values: [] }` query that can be passed straight to the `pg` module. If a `queryListener` function [has been configured](#run-time-configuration), it is called with the query as its argument now.

2. Next, the compiled SQL query is executed against the supplied `Queryable`, which is defined as a `pg.Pool` or `pg.ClientBase` (this definition covers the `TxnClient` provided by the [`transaction` helper function](#transaction)).

3. Finally, the result returned from `pg` is fed through this `SQLFragment`'s [`runResultTransform()`](#runresulttransform-qr-pgqueryresult--any) function, whose default implementation simply returns the `rows` property of the result. If a `resultListener` function [has been configured](#run-time-configuration), it is called with the transformed result as its argument now.

Examples of the `run` function are scattered throughout this documentation.

The `force` parameter is relevant only if this `SQLFragment` has been marked as a no-op (Zapatos does this when you pass an empty array to `insert` or `upsert`). By default, the database will not be disturbed in such cases, but you can force the no-op query to be run (perhaps for logging or triggering reasons) by setting `force` to `true`.


=> core.ts compile = (result: SQLQuery = { text: '', values: [] }, parentTable?: string, currentColumn?: Column) => {

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


=> core.ts runResultTransform: (qr: pg.QueryResult) => any = qr => qr.rows;

#### `runResultTransform: (qr: pg.QueryResult) => any`

When you call `run`, the function stored in this property is applied to the `QueryResult` object returned by `pg`, in order to produce the result that the `run` function ultimately returns.

By default, the `QueryResult`’s `rows` property (which is an array) is returned: that is, the default implementation is just `qr => qr.rows`. However, the [shortcut functions](#shortcut-functions-and-lateral-joins) supply their own `runResultTransform` implementations in order to match their declared `RunResult` types.

Generally you will not need to call this function directly, but there may be cases where you want to assign a new function to replace the default implementation.

For example, imagine we wanted to create a function returning a query that, when run, returns the current database timestamp directly as a `Date`. We could do so like this:

```typescript
function dbNowQuery() {
  const query = db.sql<never, Date>`SELECT now()`;
  query.runResultTransform = qr => qr.rows[0].now;
  return query;
}

const dbNow = await dbNowQuery().run(pool);
// dbNow is a Date: the result you can toggle below has come via JSON.stringify
```

Note that the `RunResult` type variable on the `sql` template function (in this case, `Date`) must reflect the type of the _transformed_ result, not what comes straight back from `pg` (which in this case is roughly `{ rows: [{ now: Date }] }`).

If a `SQLFragment` does not have `run` called on it directly — for example, if it is instead interpolated into another `SQLFragment`, or given as the value of the `lateral` option to the `select` shortcut — then the `runResultTransform` function is never applied.


### Manual joins using Postgres' JSON features

We can make use of Postgres' excellent JSON support to achieve a variety of `JOIN` queries. That's not unique to Zapatos, of course, but it may be helpful to consider a few example queries in this context. 

Take this example, retrieving each book with its (single) author:

```typescript
type bookAuthorSQL = s.books.SQL | s.authors.SQL | "author";
type bookAuthorSelectable = s.books.Selectable & { author: s.authors.Selectable };

const query = db.sql<bookAuthorSQL, bookAuthorSelectable[]>`
  SELECT ${"books"}.*, to_jsonb(${"authors"}.*) as ${"author"}
  FROM ${"books"} JOIN ${"authors"} 
  ON ${"books"}.${"authorId"} = ${"authors"}.${"id"}`;

const bookAuthors = await query.run(pool);
```

Of course, we might also want the converse query, retrieving each author with their (many) books. This is also easy enough to arrange:

```typescript
type authorBooksSQL = s.authors.SQL | s.books.SQL;
type authorBooksSelectable = s.authors.Selectable & { books: s.books.Selectable[] };

const query = db.sql<authorBooksSQL, authorBooksSelectable[]>`
  SELECT ${"authors"}.*, jsonb_agg(${"books"}.*) AS ${"books"}
  FROM ${"authors"} JOIN ${"books"} 
  ON ${"authors"}.${"id"} = ${"books"}.${"authorId"}
  GROUP BY ${"authors"}.${"id"}`;

const authorBooks = await query.run(pool);
```

Note that if you want to include authors with no books, you need a `LEFT JOIN` in this query, and then you'll also want to fix the annoying [`[null]` array results `jsonb_agg` will return for those authors](https://stackoverflow.com/questions/24155190/postgresql-left-join-json-agg-ignore-remove-null).

Rather than do it that way, though, we can achieve the same result using a [`LATERAL JOIN`](https://medium.com/kkempin/postgresqls-lateral-join-bfd6bd0199df) instead:

```typescript
type authorBooksSQL = s.authors.SQL | s.books.SQL;
type authorBooksSelectable = s.authors.Selectable & { books: s.books.Selectable[] };

const query = db.sql<authorBooksSQL, authorBooksSelectable[]>`
  SELECT ${"authors"}.*, bq.* 
  FROM ${"authors"} LEFT JOIN LATERAL (
    SELECT coalesce(json_agg(${"books"}.*), '[]') AS ${"books"}
    FROM ${"books"}
    WHERE ${"books"}.${"authorId"} = ${"authors"}.${"id"}
  ) bq ON true`;

const authorBooks = await query.run(pool);
```

Lateral joins of this sort are very flexible, and can be nested multiple levels deep — but can quickly become quite hairy in that case. The [`select` shortcut function](#select-selectone-selectexactlyone-and-count) and its [`lateral` option](#lateral-and-alias) can make this much less painful.


### Shortcut functions and lateral joins

A key contribution of Zapatos is a set of simple shortcut functions that make everyday [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) queries extremely easy to work with. Furthermore, the `select` shortcut can be nested in order to generate [LATERAL JOIN](https://www.postgresql.org/docs/12/queries-table-expressions.html#id-1.5.6.6.5.10.2) queries, resulting in arbitrarily complex nested JSON structures with inputs and outputs that are still fully and automatically typed.

Because the shortcuts make heavy use of Postgres's JSON support, their return values are generally `JSONSelectable`s rather than plain `Selectable`s. The only difference between these types is that, because JSON has no native `Date` representation, columns that would have been returned as `Date` values in a `Selectable` are instead returned as ISO 8601 strings (the result of calling `toJSON()` on them) in a `JSONSelectable`.

Since you're using Node, it's safe to convert this string straight back to a `Date` by passing it to `new Date()` (web browsers' date parsing may vary). But since JavaScript's built-in date/time support is terrible, you're probably anyway better off using a library such as [Luxon](https://moment.github.io/luxon/) (where you would instead use `DateTime.fromISO()`);

=> shortcuts.ts /* === insert === */

#### `insert`

```typescript:norun
interface InsertSignatures {
  <T extends Table>(table: T, values: InsertableForTable<T>): SQLFragment<JSONSelectableForTable<T>>;
  <T extends Table>(table: T, values: InsertableForTable<T>[]): SQLFragment<JSONSelectableForTable<T>[]>;
}
```

The `insert` shortcut inserts one or more rows in a table, and returns them with any `DEFAULT` values filled in. It takes a `Table` name and the corresponding `Insertable` or `Insertable[]`, and returns the corresponding `JSONSelectable` or `JSONSelectable[]`.

For example:

```typescript
const 
  // insert one
  steve = await db.insert('authors', { 
    name: 'Steven Hawking', 
    isLiving: false,
  }).run(pool),

  // insert many
  [time, me] = await db.insert('books', [{ 
    authorId: steve.id, 
    title: 'A Brief History of Time',
    createdAt: db.sql`now()`,
  }, { 
    authorId: steve.id, 
    title: 'My Brief History',
    createdAt: db.sql`now()`,
  }]).run(pool),

  tags = await db.insert('tags', [
    { bookId: time.id, tag: 'physics' },
    { bookId: me.id, tag: 'physicist' },
    { bookId: me.id, tag: 'autobiography' },
  ]).run(pool);
```

You'll note that `Insertable`s can take `SQLFragment` values (from the `sql` tagged template function) as well as direct values (strings, numbers, and so on). 

Postgres can accept up to 65,536 parameters per query (since [an Int16 is used](https://stackoverflow.com/a/49379324/338196) to convey the number of parameters in the _Bind_ message of the [wire protocol](https://www.postgresql.org/docs/current/protocol-message-formats.html)). If there's a risk that a multiple-row `INSERT` could have more inserted values than that, you'll need a mechanism to batch them up into separate calls.

If you provide an empty array to `insert`, this is identified as a no-op, and the database will not actually be queried unless you set the `force` option on `run` to true.

```typescript:showempty
await db.insert("authors", []).run(pool);  // never reaches DB
await db.insert("authors", []).run(pool, true);  // does reach DB, for same result
```


=> shortcuts.ts /* === update === */

#### `update`

```typescript:norun
interface UpdateSignatures {
  <T extends Table>(table: T, values: UpdatableForTable<T>, where: WhereableForTable<T> | SQLFragment): SQLFragment<JSONSelectableForTable<T>[]>;
}
```

The `update` shortcut updates rows in the database. It takes a `Table` name and a corresponding `Updatable` and `Whereable` — in that order, matching the order in a raw SQL query. It returns a corresponding `JSONSelectable[]`, listing every row affected.

For example, when we discover with that we've mis-spelled a famous physicist's name, we can do this:

```typescript
await db.update('authors', 
  { name: 'Stephen Hawking' },
  { name: 'Steven Hawking' }
).run(pool);
```

Like `Insertable` values, `Updatable` values can also be `SQLFragment`s. For instance, take a table such as the following:

```sql
CREATE TABLE "emailAuthentication" 
( "email" citext PRIMARY KEY
, "consecutiveFailedLogins" INTEGER NOT NULL DEFAULT 0
, "lastFailedLogin" TIMESTAMPTZ );
```

To atomically increment the `consecutiveFailedLogins` value, we can do something like this:

```typescript
await db.update("emailAuthentication", { 
  consecutiveFailedLogins: db.sql`${db.self} + 1`,
  lastFailedLogin: db.sql`now()`,
}, { email: 'me@privacy.net' }).run(pool);
```

=> shortcuts.ts /* === upsert === */

#### `upsert`

```typescript:norun
interface UpsertAction { $action: 'INSERT' | 'UPDATE'; }
type UpsertReturnableForTable<T extends Table> = JSONSelectableForTable<T> & UpsertAction;
type UpsertConflictTargetForTable<T extends Table> = Constraint<T> | ColumnForTable<T> | ColumnForTable<T>[];

interface UpsertSignatures {
  <T extends Table>(table: T, values: InsertableForTable<T>, conflictTarget: UpsertConflictTargetForTable<T>, noNullUpdateCols?: ColumnForTable<T> | ColumnForTable<T>[]): SQLFragment<UpsertReturnableForTable<T>>;
  <T extends Table>(table: T, values: InsertableForTable<T>[], conflictTarget: UpsertConflictTargetForTable<T>, noNullUpdateCols?: ColumnForTable<T> | ColumnForTable<T>[]): SQLFragment<UpsertReturnableForTable<T>[]>;
}
```

The `upsert` shortcut issues an [`INSERT ... ON CONFLICT ... DO UPDATE`](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT) query. Like `insert`, it takes a `Table` name and a corresponding `Insertable` or `Insertable[]`. 

It then takes, in addition, a column name (or an array thereof) or an appropriate unique index as the conflict target: the 'arbiter index(es)' on which a conflict is to be detected. Optionally, it can also take a column name or array of column names which are not to be overwritten with `NULL` in the case that the `UPDATE` branch is taken.

It returns an `UpsertReturnable` or `UpsertReturnable[]`. An `UpsertReturnable` is the same as a `JSONSelectable` except that it includes one additional property, `$action`, taking the string `'INSERT'` or `'UPDATE'` so as to indicate which eventuality occurred for each row.

Let's say we have a table of app subscription transactions:

```sql
CREATE TABLE "appleTransactions" 
( "environment" "appleEnvironment" NOT NULL  -- enum: 'PROD' or 'Sandbox'
, "originalTransactionId" TEXT NOT NULL
, "accountId" INTEGER REFERENCES "accounts"("id") NOT NULL
, "latestReceiptData" TEXT );

ALTER TABLE "appleTransactions" ADD CONSTRAINT "appleTransactionsPrimaryKey" 
  PRIMARY KEY ("environment", "originalTransactionId");
```

When we receive a purchase receipt, we need to either store a new record or update an existing record for each distinct (`environment`, `originalTransactionId`) it contains.

We can `map` the transaction data in the receipt into an `appleTransactions.Insertable[]`, and do what's needed with a single `upsert` call. In this example, though, we hard-code the `Insertable[]` for ease of exposition:

```typescript
const 
  newTransactions: s.appleTransactions.Insertable[] = [{
    environment: 'PROD',
    originalTransactionId: '123456',
    accountId: 123,
    latestReceiptData: 'TWFuIGlzIGRpc3Rp',
  }, {
    environment: 'PROD',
    originalTransactionId: '234567',
    accountId: 234,
    latestReceiptData: 'bmd1aXNoZWQsIG5v',
  }],
  result = await db.upsert('appleTransactions', newTransactions, 
    ['environment', 'originalTransactionId']).run(pool);
```

And it's wholly equivalent here to use the unique index name instead of the column names for the conflict target, by using the `constraint` wrapper function:

```typescript
const 
  anotherNewTransaction: s.appleTransactions.Insertable = {
    environment: 'PROD',
    originalTransactionId: '345678',
    accountId: 345,
    latestReceiptData: 'lALvEleO4Ehwk3T5',
  },
  result = await db.upsert('appleTransactions', anotherNewTransaction, 
    db.constraint('appleTransactionsPrimaryKey')).run(pool);
```

The same as for `insert`, an empty array provided to `upsert` is identified as a no-op, and the database will not actually be queried unless you set the `force` option on `run` to true.


=> shortcuts.ts /* === delete === */

#### `deletes`

```typescript:norun
export interface DeleteSignatures {
  <T extends Table>(table: T, where: WhereableForTable<T> | SQLFragment): SQLFragment<JSONSelectableForTable<T>[]>;
}
```

The `deletes` shortcut, unsurprisingly, deletes rows from a table (`delete`, unfortunately, is a JavaScript reserved word). It takes the table name and an appropriate `Whereable` or `SQLFragment`, and returns the deleted rows as a `JSONSelectable`.

For example:

```typescript
await db.deletes('books', { title: 'Holes' }).run(pool);
```

=> shortcuts.ts /* === truncate === */

#### `truncate`

```typescript:norun
type TruncateIdentityOpts = 'CONTINUE IDENTITY' | 'RESTART IDENTITY';
type TruncateForeignKeyOpts = 'RESTRICT' | 'CASCADE';

interface TruncateSignatures {
  (table: Table | Table[], optId: TruncateIdentityOpts): SQLFragment<undefined>;
  (table: Table | Table[], optFK: TruncateForeignKeyOpts): SQLFragment<undefined>;
  (table: Table | Table[], optId: TruncateIdentityOpts, optFK: TruncateForeignKeyOpts): SQLFragment<undefined>;
}
```

The `truncate` shortcut truncates one or more tables. It takes a `Table` name or a `Table[]` name array, and (optionally) the options `'CONTINUE IDENTITY'`/`'RESTART IDENTITY'` and/or `'RESTRICT'`/`'CASCADE'`.

For instance:

```typescript
await db.truncate('bankAccounts').run(pool);
```

One context in which this may be useful is in emptying a testing database at the start of each test run. Zapatos provides an `AllTables` type to help you ensure that you've listed all your tables:

```typescript:noresult
const allTables: s.AllTables = [
  'appleTransactions', 
  'authors', 
  'bankAccounts', 
  'books', 
  'doctors',
  'emailAuthentication', 
  'employees', 
  'shifts',
  'stores',
  'tags',
];
```

You can then empty the database like so:

```typescript:norun
// *** DON'T DO THIS IN PRODUCTION! ***
await db.truncate(allTables, 'CASCADE').run(pool);
```

=> shortcuts.ts /* === select === */

#### `select`, `selectOne`, `selectExactlyOne` and `count`

(If you want to see the full horror of these type signatures, follow the above link to the code).

The `select` shortcut function, in its basic form, takes a `Table` name and some `WHERE` conditions, and returns a `SQLFragment<JSONSelectable[]>`. Those `WHERE` conditions can be the symbol `all` (meaning: no conditions), the appropriate `Whereable` for the target table, or a `SQLFragment` from a `sql` template string. Recall that [a `Whereable` can itself contain `SQLFragment` values](#whereable), which means the `SQLFragment` variant is rarely required.

The `selectOne` function does the same except it gives us a `SQLFragment<JSONSelectable | undefined>`, promising _only a single object_ (or `undefined`) when run. 

The `selectExactlyOne` function does the same as `selectOne` but eliminates the `undefined` option (giving `SQLFragment<JSONSelectable>`), because it will instead throw an error (with a helpful `query` property) if it doesn't find a row.

The `count` function, finally, generates a query to count matching rows, and thus returns a `SQLFragment<number>`.

In use, they look like this:

```typescript
const 
  // select, no WHERE clause
  allBooks = await db.select('books', db.all).run(pool),

  // select, Whereable
  authorBooks = await db.select('books', { authorId: 1000 }).run(pool),

  // selectOne (since authors.id is a primary key), Whereable
  oneAuthor = await db.selectOne('authors', { id: 1000 }).run(pool);

  // selectExactlyOne, Whereable
  // for a more useful example, see the section on `lateral`, below
  try {
    const exactlyOneAuthor = await db.selectExactlyOne('authors', { id: 999 }).run(pool);
    // ... do something with this author ...
  } catch (err) {
    if (err instanceof db.NotExactlyOneError) console.log(`${err.name}: ${err.message}`);
    else throw err;
  }

const
  // count
  numberOfAuthors = await db.count('authors', db.all).run(pool),

  // select, Whereable with an embedded SQLFragment
  recentAuthorBooks = await db.select('books', { 
    authorId: 1001,
    createdAt: db.sql<db.SQL>`
      ${db.self} > now() - INTERVAL '7 days'` 
  }).run(pool),

  // select, SQLFragment (but a Whereable might be preferable)
  allRecentBooks = await db.select('books', db.sql<s.books.SQL>`
    ${"createdAt"} > now() - INTERVAL '7 days'`).run(pool);
```

Similar to our earlier shortcut examples, once I've typed in `'books'` or `'authors'` as the first argument to the function, TypeScript and VS Code know both how to type-check and auto-complete both the `WHERE` argument and the type that will returned by `run`.

The `select` and `selectOne` shortcuts can also take an `options` object as their third argument, which has these possible keys: `columns`, `order`, `limit`, `offset`, `extras`, `lateral`, `alias` and `lock`.


##### `columns`

The `columns` key specifies that we want to return only a subset of columns, which we might do for reasons of efficiency. It takes an array of `Column` names for the appropriate table. For example:

```typescript
const bookTitles = await db.select('books', db.all, 
  { columns: ['title'] }).run(pool);
```

The return type is appropriately narrowed to the requested columns only, so VS Code will complain if we now try to access `bookTitles[0].authorId`, for example.


##### `order`, `limit` and `offset`

The `limit` and `offset` options each take a number and pass it directly through to SQL `LIMIT` and `OFFSET` clauses. The `order` option takes an `OrderSpecForTable[]`, which has this shape:

```typescript:norun
interface OrderSpecForTable<T extends Table> {
  by: SQLForTable<T>;
  direction: 'ASC' | 'DESC';
  nulls?: 'FIRST' | 'LAST';
}
```

Putting them together gives us queries like this:

```typescript
const [lastButOneBook] = await db.select('books', db.all, { 
  order: [{ by: 'createdAt', direction: 'DESC' }], 
  limit: 1, 
  offset: 1,
}).run(pool);
```

I used destructuring assignment here (`const [lastButOneBook] = /* ... */;`) to account for the fact that I know this query is only going to return one response. Unfortunately, destructuring is just syntactic sugar for indexing, and indexing in TypeScript [doesn't reflect that the result may be undefined](https://github.com/Microsoft/TypeScript/issues/13778). That means that `lastButOneBook` is now typed as a `JSONSelectable`, but it could actually be `undefined`, and that could lead to errors down the line.

To work around this, we can use the `selectOne` function instead, which turns the example above into the following:

```typescript
const lastButOneBook = await db.selectOne('books', db.all, {
  order: [{ by: 'createdAt', direction: 'DESC' }], 
  offset: 1 
}).run(pool);
```

The `{ limit: 1 }` option is now applied automatically. And the return type following `await` needs no destructuring and is now, correctly, `JSONSelectable | undefined`.


##### `lateral` and `alias`

Earlier we put together [some big `LATERAL` joins of authors and books](#manual-joins-using-postgres-json-features). This was a powerful and satisfying application of Postgres' JSON support ... but also a bit of an eyesore, heavy on both punctuation and manually constructed and applied types.

We can improve on this. Since `SQLFragments` are already designed to contain other `SQLFragments`, it's a pretty small leap to enable `select`/`selectOne`/`count` calls to be nested inside other `select`/`selectOne` calls in order to significantly simplify this kind of `LATERAL` join query.

We achieve this with an additional `options` key, `lateral`, which takes a mapping of property names to nested query shortcuts. It allows us to write an even bigger join (of books, each with their author and tags) like so:

```typescript
const booksAuthorTags = await db.select('books', db.all, {
  lateral: {
    author: db.selectExactlyOne('authors', { id: db.parent('authorId') }),
    tags: db.select('tags', { bookId: db.parent('id') }),
  }
}).run(pool);
```

(Note that we use `selectExactlyOne` in the nested author query here because a book's `authorId` is defined as `NOT NULL REFERENCES authors(id)`, and we can therefore be 100% certain that we'll get back a row here).

Or we can turn this around, nesting more deeply to retrieve authors, each with their books, each with their tags:

```typescript
const authorsBooksTags = await db.select('authors', db.all, {
  lateral: {
    books: db.select('books', { authorId: db.parent('id') }, {
      lateral: {
        tags: db.select('tags', { bookId: db.parent('id') }, { columns: ['tag'] })
      }
    })
  }
}).run(pool);
```

You'll note the use of the `parent` function to refer to a join column in the table of the containing query. This is simply a convenience: in the join of books to authors above, we could just as well formulate the `Whereable` as:

```typescript:norun
{ authorId: sql`${"authors"}.${"id"}` }
```

We can also nest `count` calls, of course. And we can join a table to itself, though in this case we _must_ remember to use the `alias` option to define an alternative table name, resolving ambiguity.

Take this new, self-referencing table:

```sql
CREATE TABLE "employees"
( "id" SERIAL PRIMARY KEY
, "name" TEXT NOT NULL
, "managerId" INTEGER REFERENCES "employees"("id") );
```

Add some employees:

```typescript
const
  anna = await db.insert('employees', 
    { name: 'Anna' }).run(pool),
  [beth, charlie] = await db.insert('employees', [
    { name: 'Beth', managerId: anna.id },
    { name: 'Charlie', managerId: anna.id },
  ]).run(pool),
  dougal = await db.insert('employees', 
    { name: 'Dougal', managerId: beth.id }).run(pool);
```

Then query for a summary (joining the table to itself twice, with appropriate aliasing):

```typescript
const people = await db.select('employees', db.all, {
  columns: ['name'], 
  lateral: {
    lineManager: db.selectOne('employees', { id: db.parent('managerId') },
      { alias: 'managers', columns: ['name'] }),
    directReports: db.count('employees', { managerId: db.parent('id') },
      { alias: 'reports' }),
  },
}).run(pool);
```

As usual, this is fully typed. If, for example, you were to forget that `directReports` is a count rather than an array of employees, VS Code would soon disabuse you.

There are still a couple of limitations to type inference for nested queries. First, there's no check that your join makes sense (column types and `REFERENCES` relationships are not exploited in the `Whereable` term). Second, we need to manually specify `selectExactlyOne` instead of `selectOne` when we know that a join will always produce a result — such as when the relevant foreign key is `NOT NULL` and has a `REFERENCES` constraint — which in principle might be inferred for us.

Nevertheless, this is a handy, flexible — but still transparent and zero-abstraction — way to generate and run complex join queries. 


##### `extras`

The `extras` option allows us to include additional result keys that don't represent columns of our tables. That could be a computed quantity, such as a geographical distance via [PostGIS](https://postgis.net/). 

The option takes a mapping of property names to `sql` template strings (i.e. `SQLFragments`). The `RunResult` type variables of those template strings are significant, as they are passed through to the result type.

Let's see `extras` in use, with an example that shows too how the `lateral` option can go well beyond simply matching a foreign key to a primary key.

Take this new table:

```sql
CREATE EXTENSION postgis;
CREATE TABLE "stores"
( "id" SERIAL PRIMARY KEY
, "name" TEXT NOT NULL
, "geom" GEOMETRY NOT NULL );
CREATE INDEX "storesGeomIdx" ON "stores" USING gist("geom");
```

Insert some new stores:

```typescript
const gbPoint = (mEast: number, mNorth: number) =>
  db.sql`ST_SetSRID(ST_Point(${db.param(mEast)}, ${db.param(mNorth)}), 27700)`;

const [brighton] = await db.insert('stores', [
  { name: 'Brighton', geom: gbPoint(530590, 104190) },
  { name: 'London', geom: gbPoint(534930, 179380) },
  { name: 'Edinburgh', geom: gbPoint(323430, 676130) },
  { name: 'Newcastle', geom: gbPoint(421430, 563130) },
  { name: 'Exeter', geom: gbPoint(288430, 92130) },
]).run(pool);
```

And now query my local store (Brighton) plus its three nearest alternatives, with their distances in metres, using PostGIS's index-aware [`<-> operator`](https://postgis.net/docs/geometry_distance_knn.html):

```typescript
const localStore = await db.selectOne('stores', { id: 1 }, {
  columns: ['name'],
  lateral: {
    alternatives: db.select('stores', db.sql`${"id"} <> ${db.parent("id")}`, {
      alias: 'nearby',
      columns: ['name'],
      extras: {  // <-- here it is!
        distance: db.sql<s.stores.SQL, number>`
          ${"geom"} <-> ${db.parent("geom")}`,
      },
      order: [{ 
        by: db.sql<s.stores.SQL>`
          ${"geom"} <-> ${db.parent("geom")}`, 
        direction: 'ASC' 
      }],
      limit: 3,
    })
  }
}).run(pool);
```

##### `lock`

The `lock` option defines a [locking clause](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE). It takes a `SelectLockingOptions` object or `SelectLockingOptions[]` array, defined as:

```typescript:norun
export interface SelectLockingOptions {
  for: 'UPDATE' | 'NO KEY UPDATE' | 'SHARE' | 'KEY SHARE';
  of?: Table | Table[];
  wait?: 'NOWAIT' | 'SKIP LOCKED';
}
```

(And yes, this allows for arbitrary locking scenarios that a shorcut `select` can't yet need).

A couple of examples:

```typescript
const authors1 = await db.select("authors", db.all, { 
  lock: { for: "NO KEY UPDATE" } 
}).run(pool);

const authors2 = await db.select("authors", db.all, { 
  lock: { for: "UPDATE", of: "authors", wait: "NOWAIT" } 
}).run(pool);
```


=> transaction.ts export async function transaction<T, M extends Isolation>(

### `transaction`

```typescript:norun
export enum Isolation {
  // these are the only meaningful values in Postgres: 
  // see https://www.postgresql.org/docs/11/sql-set-transaction.html
  Serializable = "SERIALIZABLE",
  RepeatableRead = "REPEATABLE READ",
  ReadCommitted = "READ COMMITTED",
  SerializableRO = "SERIALIZABLE, READ ONLY",
  RepeatableReadRO = "REPEATABLE READ, READ ONLY",
  ReadCommittedRO = "READ COMMITTED, READ ONLY",
  SerializableRODeferrable = "SERIALIZABLE, READ ONLY, DEFERRABLE"
}
export async function transaction<T, M extends Isolation>(
  pool: pg.Pool,
  isolationMode: M,
  callback: (client: TxnClient<M>) => Promise<T>
): Promise<T>
```

The `transaction` helper takes a `pg.Pool` instance, an isolation mode, and an `async` callback function. It then proceeds as follows:

* Issue a `BEGIN TRANSACTION`.
* Call the callback, passing to it a database client to use in place of a `pg.Pool`.
* If a serialization error is thrown, try again after a [configurable](#run-time-configuration) random delay, a [configurable](#run-time-configuration) number of times.
* If any other error is thrown, issue a `ROLLBACK`, release the database client, and re-throw the error.
* Otherwise `COMMIT` the transaction, release the database client, and return the callback's result.

As is implied above, for `REPEATABLE READ` or `SYNCHRONIZED` isolation modes the callback could be called several times. It's therefore important that it doesn't have any non-database-related side-effects (i.e. don't, say, bill your customer's credit card from this function).

We already saw [one `transaction` example](#transactions). Here's another, adapted from [CockroachDB's write-up on `SERIALIZABLE`](https://www.cockroachlabs.com/docs/stable/demo-serializable.html).

We have a table of `doctors`, and a table of their assigned `shifts`.

```sql
CREATE TABLE "doctors"
( "id" SERIAL PRIMARY KEY
, "name" TEXT NOT NULL );

CREATE TABLE "shifts" 
( "day" DATE NOT NULL
, "doctorId" INTEGER NOT NULL REFERENCES "doctors"("id")
, PRIMARY KEY ("day", "doctorId") );
```

We populate those tables with two doctors and two days' shifts:

```typescript
await db.insert('doctors', [
  { id: 1, name: 'Annabel' }, 
  { id: 2, name: 'Brian' },
]).run(pool);

await db.insert('shifts', [
  { day: '2020-12-24', doctorId: 1 },
  { day: '2020-12-24', doctorId: 2 },
  { day: '2020-12-25', doctorId: 1 },
  { day: '2020-12-25', doctorId: 2 },
]).run(pool);
```

The important business logic is that there must always be _at least one doctor_ on shift. Now let's say both doctors happen at the same moment to request leave for 25 December.

```typescript
const requestLeaveForDoctorOnDay = async (doctorId: number, day: string) =>
  db.transaction(pool, db.Isolation.Serializable, async txnClient => {
    const otherDoctorsOnShift = await db.count('shifts', {
      doctorId: db.sql<db.SQL>`${db.self} != ${db.param(doctorId)}`,
      day,
    }).run(txnClient);
    if (otherDoctorsOnShift === 0) return false;

    await db.deletes('shifts', { day, doctorId }).run(txnClient);
    return true;
  });

const [leaveBookedForAnnabel, leaveBookedForBrian] = await Promise.all([
  // in practice, these requests would come from different front-ends
  requestLeaveForDoctorOnDay(1, '2020-12-25'),
  requestLeaveForDoctorOnDay(2, '2020-12-25'),
]);

console.log(`Leave booked for:
  Annabel – ${leaveBookedForAnnabel}
  Brian – ${leaveBookedForBrian}`);
```

Expanding the results, we see that one of the requests is retried and then fails — as it must to retain one doctor on shift — thanks to the `SERIALIZABLE` isolation (`REPEATABLE READ`, which is one isolation level weaker, wouldn't help).

#### `TxnSatisfying` types

```typescript:norun
export namespace TxnSatisfying {
  export type Serializable = Isolation.Serializable;
  export type RepeatableRead = Serializable | Isolation.RepeatableRead;
  export type ReadCommitted = RepeatableRead | Isolation.ReadCommitted;
  export type SerializableRO = Serializable | Isolation.SerializableRO;
  export type RepeatableReadRO = SerializableRO | RepeatableRead | Isolation.RepeatableReadRO;
  export type ReadCommittedRO = RepeatableReadRO | ReadCommitted | Isolation.ReadCommittedRO;
  export type SerializableRODeferrable = SerializableRO | Isolation.SerializableRODeferrable;
}
```

If you find yourself passing transaction clients around, you may find the `TxnSatisfying` types useful. For example, if you type a `txnClient` argument to a function as `TxnSatisfying.RepeatableRead`, you can call it with `Isolation.Serializable` or `Isolation.RepeatableRead` but not `Isolation.ReadCommitted`.


### Run-time configuration

There are a few configuration options you can set at runtime:

```typescript:norun
export interface Config {
  transactionAttemptsMax: number;
  transactionRetryDelay: { minMs: number, maxMs: number };
  queryListener?(str: any): void;
  resultListener?(str: any): void;
  transactionListener?(str: any): void;
};
```

Read the current values with `getConfig()` and set new values with `setConfig(newConfig: Partial<Config>)`.

* `transactionAttemptsMax` determines how many times the `transaction` helper will try to execute a query in the face of serialization errors before giving up. It defaults to `5`.

* `transactionRetryDelay` determines the range within which the `transaction` helper will pick a random delay before each retry. It's expressed in milliseconds and defaults to `{ minMs: 25, maxMs: 250 }`. 

* `queryListener` and `resultListener`, if set, are called from the `run` function, and receive the results of (respectively) compiling and then executing and transforming each query.

* `transactionListener`, similarly, is called with messages about transaction retries.

You might use one or more of the three listener functions to implement logging. They're also used in generating the _Show generated SQL, results_ elements of this documentation.


## About Zapatos


### This documentation

This document is generated from a [separate repository](https://github.com/jawj/zapatos-docs/). All generated SQL has been funnelled through [pgFormatter](https://github.com/darold/pgFormatter) for easier reading.


### Fixes, feature and contributions

If you're asking for or contributing new work, my response is likely to reflect these principles:

**Correct, consistent, comprehensible.**  I'm pretty likely to accept pull requests that fix bugs or improve readability or consistency without any major trade-offs. I'll also do my best to act on clear, minimal test cases that demonstrate unambiguous bugs.

**Small is beautiful.**  I'm less likely to accept pull requests for features that significantly complicate the code base either to address niche use-cases or to eke out minor performance gains that are almost certainly swamped by network and database latencies. 

**Scratching my own itch.**  I'm unlikely to put a lot of my own effort into features I don't currently need ... unless we're talking about paid consultancy, which I'm more than happy to discuss.


### What's next

Some nice-to-haves would include:

* **More complete typing of `lateral` queries.**  It would be great to make use of foreign key relationships and suchlike in generated types and the shortcut functions that make use of them.

* **Tests.**  The proprietary server API that's the original consumer of this library, over at [Psychological Technologies](http://www.psyt.co.uk), has a test suite that exercises most of the code base at least a little. Nevertheless, a proper test suite is still kind of indispensable. It should test not just returned values but also inferred types — which is a little fiddly.


### Alternatives

If you're interested in Zapatos, you might also want to consider [Prisma](https://www.prisma.io/), [Mammoth](https://github.com/Ff00ff/mammoth), and [PgTyped](https://github.com/adelsz/pgtyped).


### Licence

This software is released under the [MIT licence](http://www.opensource.org/licenses/mit-license.php).

Copyright (C) 2020 George MacKerron

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

<a href="https://translate.google.com/#view=home&op=translate&sl=es&tl=en&text=zapatos"><img src="zapatos.jpg" width="175" alt="Zapatos = shoes" style="margin-top: 60px; border: none;"></a>


