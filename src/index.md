<div class="logos"><img class="pg-logo" src="pg.svg" width="43.2" height="44.5" alt="Postgres logo" /><img class="ts-logo" src="ts.svg" width="50.5" height="39" alt="TypeScript logo" /></div>

# <b>Zap<span class="extra-vowels a">a</span>t<span class="extra-vowels o">o</span>s:</b> <br><span style="font-weight: normal;">Zero-Abstraction Postgres for TypeScript</span>


[Postgres](https://www.postgresql.org/) and [TypeScript](https://www.typescriptlang.org/) are each, individually, fabulous. 

Zapatos aims to make them work beautifully together. No abstractions, no distractions: just your database, with type safety.


<div class="testimonials-window"><div class="testimonials">

<div class="testimonial">
<div class="quote">

Wow this is amazing. [...] Exactly the kind of 'use SQL in typescript code with type-safety' non-ORM that I've always wanted.

</div>
<div class="attribution">
    
[ummonk, HN](https://news.ycombinator.com/item?id=24371212)

</div>
</div>


<div class="testimonial">
<div class="quote">

There are a number of TypeScript SQL libraries out there, but I found that Zapatos hits the sweet spot.

</div>
<div class="attribution">
    
[Nikola Ristić](https://risticnikola.com/tips-for-apis-typescript)

</div>
</div>


<div class="testimonial">
<div class="quote">

Zapatos is amazing. [...] I think its design is wonderful. 

</div>
<div class="attribution">

[skrebbel, HN](https://news.ycombinator.com/item?id=24367867)

</div>
</div>


<div class="testimonial">
<div class="quote">

Probably the most underrated #TypeScript #PostgreSQL package right now.

</div>
<div class="attribution">

[@andywritescode, Twitter](https://twitter.com/andywritescode/status/1265196222782070784)

</div>
</div>


<div class="testimonial">
<div class="quote">

OK just ran the sample on my own schema, whoa, this is fire.
  
</div>
<div class="attribution">

[mrjjwright, GitHub](https://github.com/jawj/zapatos/issues/19#issuecomment-642740212)

</div>
</div>


<div class="testimonial">
<div class="quote">

I’m loving zapatos now.

</div>
<div class="attribution">
    
[moltar, HN](https://news.ycombinator.com/item?id=24115311)

</div>
</div>


<div class="testimonial">
<div class="quote">

Am I crazy for thinking this seems really good?

</div>
<div class="attribution">

[@hughevans, Twitter](https://twitter.com/hughevans/status/1295914249420550144)

</div>
</div>


<div class="testimonial">
<div class="quote">

Zapatos is super nice

</div>
<div class="attribution">
    
[nikolasburk (Prisma employee), HN](https://news.ycombinator.com/item?id=26889128)

</div>
</div>


</div></div>


## What does it do?

To achieve this aim, Zapatos does these five things:

* **Typescript schema** &nbsp; A command-line tool speaks to your Postgres database and writes up a detailed TypeScript schema for every table. This is just a means to an end: it enables the next three things in this list. [Show me »](#typescript-schema)

* **Arbitrary SQL** &nbsp; Simple building blocks help you write arbitrary SQL using [tagged templates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates), and manually apply the right types to what goes in and what comes back. [Show me »](#arbitrary-sql)

* **Everyday CRUD** &nbsp; Shortcut functions produce everyday [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) queries with no fuss and no surprises, fully and automatically typed. [Show me »](#everyday-crud)

* **JOINs as nested JSON** &nbsp; Nested shortcut calls generate [LATERAL JOIN](https://www.postgresql.org/docs/12/queries-table-expressions.html#id-1.5.6.6.5.10.2) queries, resulting in arbitrarily complex nested JSON structures, still fully and automatically typed. [Show me »](#joins-as-nested-json)

* **Transactions** &nbsp; Transaction helper functions assist in managing and retrying transactions. [Show me »](#transactions)


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

We run `npx zapatos` to generate a file named `schema.d.ts`, including table definitions like this one:

```typescript:norun
export namespace authors {
  export type Table = 'authors';
  export interface Selectable {
    id: number;
    name: string;
    isLiving: boolean | null;
  }
  export interface Whereable {
    id?: number | db.Parameter<number> | db.SQLFragment /* | ... etc ... */;
    name?: string | db.Parameter<string> | db.SQLFragment /* | ... etc ... */;
    isLiving?: boolean | db.Parameter<boolean> | db.SQLFragment /* | ... etc ... */;
  }
  export interface Insertable {
    id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment;
    name: string | db.Parameter<string> | db.SQLFragment;
    isLiving?: boolean | db.Parameter<boolean> | null | db.DefaultType | db.SQLFragment;
  }
  export interface Updatable {
    id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment /* | ... etc ... */;
    name?: string | db.Parameter<string> | db.SQLFragment /* | ... etc ... */;
    isLiving?: boolean | db.Parameter<boolean> | null | db.DefaultType | db.SQLFragment /* | ... etc ... */;
  }
  /* ... etc ... */
}
```

The type names are, I hope, reasonably self-explanatory. `authors.Selectable` is what I'll get back from a `SELECT` query on this table. `authors.Whereable` is what I can use in a `WHERE` condition: everything's optional, and I can include arbitrary SQL. `authors.Insertable` is what I can `INSERT`: it's similar to the `Selectable`, but any fields that are `NULL`able and/or have `DEFAULT` values are allowed to be missing, `NULL` or `DEFAULT`. `authors.Updatable` is what I can `UPDATE` the table with: like what I can `INSERT`, but all columns are optional: it's (roughly) a `Partial<authors.Insertable>`. 

`schema.d.ts` includes some other types that get used internally, including handy type mappings like this one:

```typescript:norun
export type SelectableForTable<T extends Table> = {
  authors: authors.Selectable;
  books: books.Selectable;
  tags: tags.Selectable;
  /* ... */
}[T];
```

Currently, ordinary tables and materialized views are supported. Enumerated types are catered for — e.g. `CREATE TYPE "ab" AS ENUM ('a', 'b');` becomes TypeScript type `'a' | 'b'`. [Domain types](https://www.postgresql.org/docs/current/domains.html) start out aliased to their base types, but can be customised from there. This enables sub-schemas to be defined for `json` columns, amongst other things. User-defined types can be customised too.

[Tell me more about the command line tool »](#how-do-i-get-it)

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
  { name: 'Jane Austen', isLiving: false },
]).run(pool);
```

The `insert` shortcut accepts a single `Insertable` or an `Insertable[]` array, and correspondingly returns a single [`JSONSelectable`](#jsonselectable) or a `JSONSelectable[]` array. Since we specified `'authors'` as the first argument here, and an array as the second, input and output will be checked and auto-completed as `authors.Insertable[]` and `authors.JSONSelectable[]` respectively.

_Again, click 'Explore types' to play around and check those typings._ 

In addition to `insert`, there are shortcuts for `select` (plus `selectOne`, `selectExactlyOne` and `count`), and for `update`, `upsert`, `delete` and `truncate`. 

[Tell me more about the shortcut functions »](#shortcut-functions-and-lateral-joins)


#### JOINs as nested JSON

**Nested shortcut calls generate [LATERAL JOIN](https://www.postgresql.org/docs/12/queries-table-expressions.html#id-1.5.6.6.5.10.2) queries, resulting in arbitrarily complex nested JSON structures, still fully and automatically typed.**

CRUD is our bread and butter, but the power of SQL is in the `JOIN`s. Postgres has powerful JSON features than can deliver sensibly-structured `JOIN` results with minimal post-processing: `json_agg`, `json_build_object`, and so on. Zapatos builds on these.

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

And let's say I want to show a list of books, each with its (one) author and (many) associated tags. We could knock up a manual query for this, of course, but [it gets quite hairy](#manual-joins-using-postgres-json-features). The `select` shortcut has an option called `lateral` that can nest other `select` queries and do it for us. 

Let's try it:

```typescript
const bookAuthorTags = await db.select('books', db.all, {
  lateral: {
    author: db.selectExactlyOne('authors', { id: db.parent('authorId') }),
    tags: db.select('tags', { bookId: db.parent('id') }),
  }
}).run(pool);
```

This generates an efficient three-table `LATERAL JOIN` that returns a nested JSON structure directly from the database. Every nested element is again fully and automatically typed.

_Again, you can click 'Explore types' above to open the code in an embedded Monaco (VS Code) editor, so you can check those typings for yourself._ 

We can of course extend this to deeper nesting (e.g. query each author, with their books, with their tags); to self-joins (of a table with itself, e.g. employees to their managers in the same `employees` table); and to joins on relationships other than foreign keys (e.g. joining the nearest _N_ somethings using the PostGIS `<->` distance operator).

[Tell me more about nested `select` queries »](#lateral-and-alias)


#### Transactions

**Transaction helper functions assist in managing and retrying transactions.**

Transactions are where I've found traditional ORMs like TypeORM and Sequelize most footgun-prone. Zapatos is always explicit about what client or pool is running your query — hence that `pool` argument in all our examples so far. 

Zapatos also offers simple transaction helpers that handle issuing a SQL `ROLLBACK` on error, releasing the database client in a `finally` clause, and automatically retrying queries in case of serialization failures. There's one for each isolation level (`SERIALIZABLE`, `REPEATABLE READ`, and so on), and they look like this:

```typescript:noresult
const result = await db.serializable(pool, async txnClient => {
  /* queries here use txnClient instead of pool */
});
```

For instance, take this `bankAccounts` table:

```sql
CREATE TABLE "bankAccounts" 
( "id" SERIAL PRIMARY KEY
, "balance" INTEGER NOT NULL DEFAULT 0 CHECK ("balance" >= 0) );
```

We can use the transaction helpers like so:

```typescript
const [accountA, accountB] = await db.insert('bankAccounts', 
  [{ balance: 50 }, { balance: 50 }]).run(pool);

const transferMoney = (sendingAccountId: number, receivingAccountId: number, amount: number) =>
  db.serializable(pool, txnClient => Promise.all([
    db.update('bankAccounts',
      { balance: db.sql`${db.self} - ${db.param(amount)}` },
      { id: sendingAccountId }).run(txnClient),
    db.update('bankAccounts',
      { balance: db.sql`${db.self} + ${db.param(amount)}` },
      { id: receivingAccountId }).run(txnClient),
  ]));

try {
  const [[updatedAccountA], [updatedAccountB]] = await transferMoney(accountA.id, accountB.id, 60);
} catch(err) {
  console.log(err.message, '/', err.detail);
}
```

Finally, Zapatos provides a set of hierarchical isolation types so that, for example, if you type a `txnClient` argument to a function as `TxnClientForRepeatableRead`, you can call it with `IsolationLevel.Serializable` or `IsolationLevel.RepeatableRead` but not `IsolationLevel.ReadCommitted`.

[Tell me more about the transaction functions »](#transaction)


### Why does it do those things?

It is a truth universally acknowledged that [ORMs aren't very good](https://en.wikipedia.org/wiki/Object-relational_impedance_mismatch). 

I like SQL, and Postgres especially. In my experience, abstractions that obscure the underlying SQL, or that prioritise ease of switching to another database tomorrow over effective use of _this_ database _today_, are a source of misery.

I've also come to love strongly typed languages, and TypeScript in particular. VS Code's type checking and autocomplete speed development, prevent bugs, and simplify refactoring. Especially when they _just happen_, they bring joy. But, traditionally, talking to the database is a place where they really don't _just happen_.

Zapatos aims to fix that.

If it interests you, there's a whole other [repository about how Zapatos came about](https://github.com/jawj/mostly-ormless).

### What doesn't it do?

Zapatos doesn't handle schema migrations. Other tools can help you with this: check out [dbmate](https://github.com/amacneil/dbmate), for instance.

It also doesn't manage the connection pool for you, as some ORMs do — mainly because the `pg` module makes this so easy. For example, my `pgPool.ts` looks something like this:

```typescript:norun
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', err => console.error(err));  // don't let a pg restart kill your app

export default pool;
```

Finally, it won't tell you how to structure your code: Zapatos doesn't deal in the 'model' classes beloved of traditional ORMs, just (fully-typed) [POJOs](https://twitter.com/_ericelliott/status/831965087749533698?lang=en).


## How do I get it?

### Install it

First: check your `tsconfig.json`. You need `"strictNullChecks": true` or `"strict": true` (which implies `"strictNullChecks": true`). Without `strictNullChecks`, some things just won't work — namely, the `lateral`, `extras`, `returning` and `columns` options to the shortcut functions.

Then install Zapatos with `npm`:

```bash
npm install --save zapatos
```

### Configure it

Add a top-level file `zapatosconfig.json` to your project. Here's an example:

```json
{
  "db": {
    "connectionString": "postgresql://localhost/example_db"
  },
  "outDir": "./src"
}
```

The available top-level keys are:

* `"db"` gives Postgres connection details **and is the only required key**. You can provide [anything that you'd pass](https://node-postgres.com/features/connecting/#Programmatic) to `new pg.Pool(/* ... */)` here.

* `"outDir"` defines where your `zapatos` folder will be created, relative to the project root. If not specified, it defaults to the project root, i.e. `"."`.

* `"outExt"` defines the file extension for all generated type files. It defaults to `".d.ts"`, but [for certain use cases you may wish to set it to `".ts"`](https://github.com/jawj/zapatos/issues/53).

* `"progressListener"` is a boolean that determines how chatty the tool is. If `true`, it enumerates its progress in generating the schema. It defaults to `false`. If you [generate your schema programmatically](#programmatic-generation), you can alternatively provide your own listener function.

* `"warningListener"` is a boolean that determines whether or not the tool logs a warning when a new user-defined type or domain is encountered and given its own type file in `zapatos/custom`. If `true`, which is the default, it does. Again, if you [generate your schema programmatically](#programmatic-generation), you can alternatively provide your own listener function.

* `"customTypesTransform"` is a string that determines how user-defined Postgres type names are mapped to TypeScript type names. Your options are `"my_type"`, `"PgMyType"` or `"PgMy_type"`, each representing how a Postgres type named `my_type` will be transformed. The default (for reasons of backward-compatibility rather than superiority) is `"PgMy_type"`. If you [generate your schema programmatically](#programmatic-generation), you can alternatively define your own transformation function.

* `"schemas"` is an object that lets you define schemas and tables (and materialized views) to include and exclude. Each key is a schema name, and each value is an object with keys `"include"` and `"exclude"`. Those keys can take the values `"*"` (for all tables in schema) or an array of table names. The `"exclude"` list takes precedence over the `"include"` list.

Note that schemas are not properly supported by Zapatos, since they are not included in the output types, but they can be made to work by using the Postgres [search path](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH) **if and only if** all of your table names are unique across all schemas. To make this work, you'll need to set something like this: 

```sql
ALTER DATABASE "mydb" SET "search_path" TO "$user", "public", "additionalSchema1", "additionalSchema2";`
```

If not specified, the default value for `"schemas"` includes all tables in the `public` schema, i.e.:

```json
"schemas": {
  "public": {
    "include": "*",
    "exclude": []
  }
}
```

If you use PostGIS, you'll likely want to exclude its system tables:

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

* `"columnOptions"` is an object mapping options to named columns of named (or all) tables. Currently, you can use it to manually exclude column keys from the `Insertable` and `Updatable` types, using the options `"insert": "excluded"` and `"update": "excluded"`, or to force column keys to be optional in `Insertable` types, using the option `"insert": "optional"`.

This supports use cases where columns are set using triggers. 

For example, say you have a `BEFORE INSERT` trigger on your `customers` table that can guess a default value for the `gender` column based on the value of the `title` column (though note: [don't do that](https://design-system.service.gov.uk/patterns/gender-or-sex/)). In this case, the `gender` column is actually optional on insert, even if it's `NOT NULL` with no default, because the trigger provides a default value. You can tell Zapatos about that like so:

```json
"columnOptions": {
  "customers": {
    "gender": {
      "insert": "optional"
    }
  }
}
```

You can also use `"*"` as a wildcard to match all tables. For example, perhaps you've set up the appropriate triggers to keep `updatedAt` columns up to date throughout your database. Then you might choose to exclude all your `updatedAt` columns from the `Insertable` and `Updatable` types for all tables as follows:

```json
"columnOptions": {
  "*": {
    "updatedAt": {
      "insert": "excluded",
      "update": "excluded"
    }
  }
}
```

Wildcard table options have lower precedence than named table options. The default values, should you want to restore them for named tables, are `"insert": "auto"` and `"update": "auto"`. Note that `"*"` is only supported as the whole key — you can't use a `*` to match parts of names — and only for tables, not for columns.

* `"schemaJSDoc"` is a boolean that turns JSDoc comments for each column in the generated schema on (the default) or off. JSDoc comments enable per-column VS Code pop-ups giving details of Postgres data type, default value and so on. They also make the schema file longer and less readable.

In summary, the expected structure is defined like so:

```typescript:norun
export interface RequiredConfig {
  db: pg.ClientConfig;
}

export interface OptionalConfig {
  outDir: string;
  outExt: string;
  schemas: SchemaRules;
  progressListener: boolean | ((s: string) => void);
  warningListener: boolean | ((s: string) => void);
  customTypesTransform: 'PgMy_type' | 'my_type' | 'PgMyType' | ((s: string) => string);
  columnOptions: ColumnOptions;
  schemaJSDoc: boolean;
}

interface SchemaRules {
  [schema: string]: {
    include: '*' | string[];
    exclude: '*' | string[];
  };
}

interface ColumnOptions {
  [k: string]: {  // table name or '*'
    [k: string]: {  // column name
      insert?: 'auto' | 'excluded' | 'optional';
      update?: 'auto' | 'excluded';
    };
  };
}

export type Config = RequiredConfig & Partial<OptionalConfig>;
```


#### Environment variables

All values in `zapatosconfig.json` can have environment variables (Node's `process.env.SOMETHING`) interpolated via [handlebars](https://handlebarsjs.com/)-style doubly-curly-brackets `{{variables}}`. 

This is likely most useful for the database connection details. For example, on Heroku you might configure your database as:

```json
"db": {
  "connectionString": "{{DATABASE_URL}}"
}
```

#### ESLint / tslint

A general configuration suggestion: set up [ESLint](https://github.com/typescript-eslint/typescript-eslint/blob/master/docs/getting-started/linting/README.md) with the rules [`@typescript-eslint/await-thenable`](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/await-thenable.md) and [`@typescript-eslint/no-floating-promises`](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-floating-promises.md) (or the now-deprecated [tslint](https://palantir.github.io/tslint/) with [`no-floating-promises`](https://palantir.github.io/tslint/rules/no-floating-promises/) and [`await-promise`](https://palantir.github.io/tslint/rules/await-promise/)) to avoid various `Promise`-related pitfalls.


### Generate your schema

Zapatos provides a command line tool. With everything configured, run it like so:
    
    npx zapatos

This generates the TypeScript schema for your database as `zapatos/schema.d.ts` inside your configured `outDir`. Any user-defined or domain types encountered get defined within `zapatos/custom` in their own `.d.ts` files, which you can subsequently customise.

These files must be included in your TypeScript compilation. That may happen for you automatically, but you may need to check the `"include"` or `"files"` keys in `tsconfig.json`. If you use `ts-node` or `node -r ts-node/register`, you may need to change it to `ts-node --files` or set `TS_NODE_FILES=true`.


#### Programmatic generation

As an alternative to the command line tool, it's also possible to generate the schema programmatically by importing from `zapatos/generate`. For example:

```typescript:norun
import * as zg from 'zapatos/generate';

const zapCfg: zg.Config = { db: { connectionString: 'postgres://localhost/mydb' } };
await zg.generate(zapCfg);
```

Call the `generate` method with an object structured exactly the same as `zapatosconfig.json`, documented above, with the following two exceptions: 

* The `"progressListener"` and `"warningListener"` keys can each take `true` or `false` (as in the JSON case), or alternatively a function with the signature `(s: string) => void`, which you can use to implement your own logging.

* The `"customTypesTransform"` key can take any of the string values allowed in the JSON case, or otherwise a function with the signature `(s: string) => string`, with which you can define your own type name transformation.


#### Custom types and domains

As mentioned previously, any user-defined or domain types encountered during schema generation get defined in their own `.d.ts` files under `zapatos/custom`, which you can subsequently customise.

You can use domain types in order to specify custom types on the TypeScript side for certain Postgres columns. Say, for example, that you have a Postgres `jsonb` column on which you want to impose a particular structure. You could do the following:

```sql
CREATE DOMAIN "mySpecialJsonb" AS "jsonb";
```

Since you've done nothing else with this domain, it's effectively just a simple alias to `jsonb` on the Postgres side. Now you can use that in place of `jsonb` in your table definition:

```sql
ALTER TABLE "myTable" ALTER COLUMN "myExistingJsonbColumn" TYPE "mySpecialJsonb";
```

When you next regenerate the TypeScript schema, you'll find a custom type for `PgMySpecialJsonb` in `zapatos/custom/PgMySpecialJsonb.d.ts`, defined like so:

```typescript:norun
export type PgMySpecialJsonb = db.JSONValue;
```

You can of course replace this definition with whatever TypeScript type or interface you choose. The file will not be overwritten on future schema generations. For example, perhaps this column holds blog article data:

```typescript:norun
export interface PgMySpecialJsonb {
  title: string;
  text: string;
  tags: string[];
  version: number;
};
```

### Import it

In your code, get the core library like so: 

```typescript:norun
import * as db from 'zapatos/db';
```

ESM wrappers are provided, so the import should work the same whether your project is set to use the CommonJS or ESM module specs.

To import your ordinary schema types (`myTable.Selectable`, `myOtherTable.Insertable`, etc.):

```typescript:norun
import type * as s from 'zapatos/schema';
```

Be sure to `import type` for this, not plain `import`, or you'll upset `ts-jest` and maybe others. 

To import any user-defined or domain types:

```typescript:norun
import type * as c from 'zapatos/custom';
```

The paths `zapatos/db` and `zapatos/generate` point to real folders in `node_modules`. Although they look like file paths, `zapatos/schema` and `zapatos/custom` are actually the names of [ambient modules](https://www.typescriptlang.org/docs/handbook/modules.html#ambient-modules) declared in the generated files in your source tree: `zapatos/schema.d.ts` and `zapatos/custom/*.d.ts`.


## User guide

=> core.ts // === SQL tagged template strings ===

### `sql` tagged template strings

Arbitrary queries are written using the tagged template function `sql`, which returns [`SQLFragment`](#sqlfragment) class instances.

The `sql` function is [generic](https://www.typescriptlang.org/docs/handbook/generics.html), having two type variables. For example: 

```typescript
const authors = await db.sql<s.authors.SQL, s.authors.Selectable[]>`
  SELECT * FROM ${"authors"}`.run(pool);
```

The first type variable, `Interpolations` (above: `s.authors.SQL`), defines allowable interpolation values. If not specified, it defaults to `db.SQL`: this is the union of all the per-table `SQL` types, and thus allows all table and column names present in the database as string interpolations (some of which would throw runtime errors in this case).

As another example, imagine we were joining the `authors` and `books` tables. Then we could specify `s.authors.SQL | s.books.SQL` for `Interpolations` here.

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

More critically, **never never never** override the type-checking so as to write:

```typescript
const 
  nameSubmittedByUser = 'books"; DROP TABLE "authors"; --',
  title = await db.sql<any>`
    SELECT * FROM ${nameSubmittedByUser} LIMIT 1`.run(pool);  // NEVER do this!
```

If you override type-checking to pass untrusted data to Zapatos in unexpected places, such as the above use of `any`, you can expect successful SQL injection attacks. 

(It *is* safe to pass untrusted data as values in `Whereable`, `Insertable`, and `Updatable` objects, manually by using [`param`](#paramvalue-any-cast-boolean--string-parameter), and in certain other places. If you're in any doubt, double-check that the generated SQL is using `$1`, `$2`, ... parameters for all potentially untrusted data).


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

Any plain JavaScript object interpolated into a `sql` template string is type-checked as a `Whereable`, and compiled into one or more conditions joined with `AND` (but, for flexibility, no `WHERE`). The object's keys represent column names, and the corresponding values are automatically compiled as (injection-safe) [`Parameter`](#paramvalue-any-cast-boolean--string-parameter) instances.

For example:

```typescript
const 
  title = 'Northern Lights',
  books = await db.sql<s.books.SQL, s.books.Selectable[]>`
    SELECT * FROM ${"books"} WHERE ${{ title }}`.run(pool);
```

(If you need to specify a `CAST` of a parameter to a specific SQL type, you can also manually wrap `Whereable` values using [`param`](#paramvalue-any-cast-boolean--string-parameter) — this is useful primarily when using [the shortcut functions](#shortcut-functions-and-lateral-joins)).

A `Whereable`'s values can alternatively be `SQLFragments`, and this makes them extremely flexible. In a `SQLFragment` inside a `Whereable`, the special symbol `self` can be used to refer to the column name. This arrangement enables us to use any operator or function we want — not just `=`.

For example:

```typescript
const 
  titleLike = 'Northern%',
  books = await db.sql<s.books.SQL, s.books.Selectable[]>`
    SELECT * FROM ${"books"} WHERE ${{ 
      title: db.sql`${db.self} LIKE ${db.param(titleLike)}`,
      createdAt: db.sql`${db.self} > now() - INTERVAL '7 days'`,
    }}`.run(pool);
```
 
Finally, there's a set of helper functions you can use to create appropriate `SQLFragment`s like these for use as `Whereable` values. The advantages are: (1) there's slighly less to type, and (2) you get type-checking on their arguments (so you're not tempted to compare incomparable things). 

They're exported under `conditions` on the main object, and the full set can be seen in [conditions.ts](https://github.com/jawj/zapatos/blob/master/src/db/conditions.ts). Using two of them, we'd rewrite the above example as:

```typescript
const 
  titleLike = 'Northern%',
  books = await db.sql<s.books.SQL, s.books.Selectable[]>`
    SELECT * FROM ${"books"} WHERE ${{ 
      title: dc.like(titleLike),
      createdAt: dc.gt(db.sql`now() - INTERVAL '7 days'`),
    }}`.run(pool);
```


#### `self`

The use of the `self` symbol is explained in [the section on `Whereable`s](#whereable).


#### `param(value: any, cast?: boolean | string): Parameter`

In general, Zapatos' type-checking won't let us [pass user-supplied data unsafely into a query](https://xkcd.com/327/) by accident. The `param` wrapper function exists to enable the safe passing of user-supplied data into a query using numbered query parameters (`$1`, `$2`, ...). 

For example:

```typescript
const 
  title = 'Pride and Prejudice',
  books = await db.sql<s.books.SQL, s.books.Selectable[]>`
    SELECT * FROM ${"books"} WHERE ${"title"} = ${db.param(title)}`.run(pool);
```

This same mechanism is applied automatically when we use [a `Whereable` object](#whereable) (and in this example, using a `Whereable` would be more readable and more concise). It's also applied when we use [the `vals` function](#cols-and-vals) to create a `ColumnValues` wrapper object.

The optional second argument to `param`, `cast`, allows us to specify a SQL `CAST` type for the wrapped value. If `cast` is a string, it's interpreted as a Postgres type, so `param(someValue, 'text')` comes out in the compiled query as as `CAST($1 TO "text")`. If `cast` is `true`, the parameter value will be JSON stringified and cast to `json`, and if `cast` is `false`, the parameter will **not** be JSON stringified or cast to `json` (regardless, in both cases, of [the `castArrayParamsToJson` and `castObjectParamsToJson` configuration options](#casting-parameters-to-json)).


#### `Default`

The `Default` symbol simply compiles to the SQL `DEFAULT` keyword. This may be useful in `INSERT` and `UPDATE` queries where no value is supplied for one or more of the affected columns.


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
      subQ.parentTable = aliasedTable;  // enables `parent()` in subquery's Whereables
      return sql<SQL>` LEFT JOIN LATERAL (${subQ}) AS ${raw(`"cj_${k}"`)} ON true`;
    });
```

The `lateralSQL` variable — a `SQLFragment[]` — is subsequently interpolated into the final query (some additional SQL using `jsonb_build_object()` is interpolated earlier in that query, to return the result of the lateral subquery alongside the main query columns).

Note that a useful idiom also seen here is the use of the empty array (`[]`) to conditionally interpolate nothing at all.


#### `raw(value: string): DangerousRawString`

The `raw` function returns `DangerousRawString` wrapper instances. This represents an escape hatch, enabling us to interpolate arbitrary strings into queries in contexts where the `param` wrapper is unsuitable (such as when we're interpolating basic SQL syntax elements). **If you pass user-controlled data to this function you will open yourself up to SQL injection attacks.**


#### `parent(columnName: string): ParentColumn`

Within queries passed as subqueries to the `lateral` option of `select`, `selectOne` or `selectExactlyOne`, the `parent()` wrapper can be used to refer to a column of the table that's the subject of the immediately containing query. For details, see the [documentation for the `lateral` option](#lateral-and-alias).


### `SQLFragment`

`SQLFragment<RunResult>` class instances are what is returned by the `sql` tagged template function — you're unlikely ever to contruct them directly with `new`. They take on the `RunResult` type variable from the `sql` template function that constructs them.

You can [interpolate them](#sql-template-strings) into other `sql` tagged template strings, or call/access the following properties on them:


=> core.ts prepared = (name = `_zapatos_prepared_${preparedNameSeq++}`) => {

#### `prepared(name: string): this`

The `prepared` function causes a `name` property to be added to the compiled SQL query object that's passed to `pg`, and this [instructs Postgres to treat it as a prepared statement](https://node-postgres.com/features/queries#prepared-statements). You can specify a prepared statement name as the function's argument, or let it default to `"_zapatos_prepared_N"` (where N is a sequence number). This name appears in the Postgres logs.


=> core.ts run = async (queryable: Queryable, force = false): Promise<RunResult> => {

#### `async run(queryable: Queryable, force = false): Promise<RunResult>`

The `run` function compiles, executes, and returns the transformed result of the query represented by this `SQLFragment`. The `awaited` return value is typed according to the `SQLFragment`'s `RunResult` type variable.

Taking that one step at a time:

1. First, [the `compile` function](#compile-sqlquery) is called, recursively compiling this `SQLFragment` and its interpolated values into a `{ text: '', values: [] }` query that can be passed straight to the `pg` module. If a `queryListener` function [has been configured](#run-time-configuration), it is called with the query as its argument now.

2. Next, the compiled SQL query is executed against the supplied `Queryable`, which is defined as a `pg.Pool` or `pg.ClientBase` (this definition covers the `TxnClient` provided by the [`transaction` helper function](#transaction)).

3. Finally, the result returned from `pg` is fed through this `SQLFragment`'s [`runResultTransform()`](#runresulttransform-qr-pgqueryresult--any) function, whose default implementation simply returns the `rows` property of the result. If a `resultListener` function [has been configured](#run-time-configuration), it is called with the transformed result as its argument now.

Examples of the `run` function are scattered throughout this documentation.

The `force` parameter is relevant only if this `SQLFragment` has been marked as a [no-op](https://en.wiktionary.org/wiki/no-op#Etymology_2): at present, Zapatos does this automatically if you pass an empty array to `insert` or `upsert`. By default, the database will not be disturbed in such cases, but you can force a no-op query to actually be run against the database — perhaps for logging or triggering reasons — by setting `force` to `true`.


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

The shortcut functions make heavy use of Postgres' JSON support, and their return values are thus [`JSONSelectable`](#jsonselectable)s rather than the plain `Selectable`s you'd get back from a manual query.


=> shortcuts.ts /* === insert === */

#### `insert`

The `insert` shortcut inserts one or more rows in a table, and returns them with any `DEFAULT` or generated values filled in. It takes a `Table` name and the corresponding `Insertable` or `Insertable[]`, and returns the corresponding `JSONSelectable` or `JSONSelectable[]` (subject to the options described below).

The optional `options` argument has two keys.

* `returning` takes an array of column names, and narrows down the returned values accordingly. This may be useful if you are inserting large objects which you prefer don't take an inefficient return trip over the wire and through the JSON parser. 

* `extras` takes a map of string keys to column names and/or `sql` template strings (i.e. `SQLFragments`), allowing you to alias certain columns and/or compute and return other quantities alongside them. The `RunResult` type variable matters in the case of template strings, as it is passed through to the result type.

(Note that type inference can only do the right thing with `returning` and `extras` when `strictNullChecks` are enabled).

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
  ]).run(pool),

  // insert with custom return values
  nutshell = await db.insert('books', { 
    authorId: steve.id, 
    title: 'The Universe in a Nutshell',
    createdAt: db.sql`now()`,
  }, {
    returning: ['id'],
    extras: { 
      aliasedTitle: "title",
      upperTitle: db.sql<s.books.SQL, string | null>`upper(${"title"})`,
    },
  }).run(pool);

```

You'll note that `Insertable`s can take `SQLFragment` values (from the `sql` tagged template function) as well as direct values (strings, numbers, and so on). 

Postgres can accept up to 65,536 parameters per query (since [an Int16 is used](https://stackoverflow.com/questions/6581573/what-are-the-max-number-of-allowable-parameters-per-database-provider-type/49379324#49379324) to convey the number of parameters in the _Bind_ message of the [wire protocol](https://www.postgresql.org/docs/current/protocol-message-formats.html)). If there's a risk that a multiple-row `INSERT` could have more inserted values than that, you'll need a mechanism to batch them up into separate calls.

If you provide an empty array to `insert`, this is identified as a no-op, and the database will not actually be queried unless you set the `force` option on `run` to true.

```typescript:showempty
await db.insert("authors", []).run(pool);  // never reaches DB
await db.insert("authors", []).run(pool, true);  // does reach DB, for same result
```


=> shortcuts.ts /* === update === */

#### `update`

The `update` shortcut updates rows in the database. It takes a `Table` name and a corresponding `Updatable` and `Whereable` **in that order, matching their order in the raw SQL query**. 

It returns a `JSONSelectable[]`, listing every column of every row affected (or a subset or superset of those columns, if you use the `returning` and/or `extras` options, which work just as described above for `insert`).

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
  // or equivalently: consecutiveFailedLogins: dc.add(1),
  lastFailedLogin: db.sql`now()`,
}, { email: 'me@privacy.net' }).run(pool);
```

=> shortcuts.ts /* === upsert === */

#### `upsert`

The `upsert` shortcut issues an [`INSERT ... ON CONFLICT ...`](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT) query. Like `insert`, it takes a `Table` name and a corresponding `Insertable` or `Insertable[]`. 

It then takes, in addition, a column name (or an array thereof) or an appropriate unique index as the conflict target: the 'arbiter index(es)' on which a conflict is to be detected. 

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


##### `upsert` options

The optional fourth argument to `upsert` is an `options` object. The available options are `returning` and `extras` (see the documentation for `insert` for details) plus `updateColumns`, `noNullUpdateColumns`, `updateValues` and `reportAction`. 

* The `updateColumns` option allows us to specify a subset of columns (as either one name or an array of names) that are to be updated on conflict. For example, you might want to include all columns except `createdAt` in this list.

* The `noNullUpdateColumns` option takes a column name or array of column names which are not to be overwritten with `NULL` in the case that the `UPDATE` branch is taken.

* The `updateValues` option allows us to specify alternative column values to be used in the `UPDATE` query branch: [see below](#updatevalues).

* The `reportAction: 'suppress'` option causes the `$action` result key to be omitted, so the query returns plain `JSONSelectable` instead of `UpsertReturnable` results.


##### `INSERT ... ON CONFLICT ... DO NOTHING`

A special case arises if you pass the empty array `[]` to the `updateColumns` option of `upsert`. 

Since no columns are then to be updated in case of a conflict, an `ON CONFLICT ... DO NOTHING` query is generated instead of an `ON CONFLICT ... DO UPDATE ...` query. For better self-documenting code, an alias for the empty array is provided for this case: `doNothing`.

Since nothing is returned by Postgres for any `DO NOTHING` cases, a query with `updateColumns: []` or `updateColumns: db.doNothing` may return fewer rows than were passed in. If you pass in an array, you could get back an empty array if all rows conflict with existing rows. If you pass in values of a single row, you'll get back `undefined` if a conflict occurs (and the return type will automatically reflect this).

For example:

```sql
CREATE TABLE "usedVoucherCodes" 
( "code" text PRIMARY KEY
, "redeemedAt" timestamptz NOT NULL DEFAULT now()
);
```

```typescript:shownull
// unused code: returns the inserted row
const a = await db.upsert('usedVoucherCodes', 
  { code: 'XYE953ZVU767' }, 'code', 
  { updateColumns: db.doNothing }).run(pool);

// same code, already used: returns undefined
const b = await db.upsert('usedVoucherCodes', 
  { code: 'XYE953ZVU767' }, 'code', 
  { updateColumns: db.doNothing }).run(pool);
```

##### `updateValues`

You can use the `updateValues` option to specify alternative column values to be used in the `UPDATE` branch of the query. Only one set of values can be provided: these will be used for any and all rows that get updated.

This may be useful, for example, when keeping a count, using a table such as this:

```sql
CREATE TABLE "nameCounts" 
( "name" text PRIMARY KEY
, "count" integer NOT NULL
);
```

In the following query, we insert a new value with a count of 1 if a name doesn't already exist in the table. If a name does exist, we increment the existing count instead:

```typescript
for (let i = 0; i < 2; i++) {
  await db.upsert('nameCounts',
    { name: 'Alice', count: 1 }, 'name',
    { updateValues: { count: db.sql`${"nameCounts"}.${"count"} + 1` } }
  ).run(pool);
}
```

=> shortcuts.ts /* === delete === */

#### `deletes`

The `deletes` shortcut, unsurprisingly, deletes rows from a table (`delete`, unfortunately, is a JavaScript reserved word). It takes the table name and an appropriate `Whereable` or `SQLFragment`, and by default returns the deleted rows as a `JSONSelectable`. 

Again, you can narrow or broaden what's returned with the `returning` and `extras` options, as documented above for `insert`.

For example:

```typescript
await db.deletes('books', { title: 'Holes' }, { returning: ['id'] }).run(pool);
```

=> shortcuts.ts /* === truncate === */

#### `truncate`

The `truncate` shortcut truncates one or more tables. It takes a `Table` name or a `Table[]` name array, and (optionally) the options `'CONTINUE IDENTITY'`/`'RESTART IDENTITY'` and/or `'RESTRICT'`/`'CASCADE'`.

For instance:

```typescript
await db.truncate('bankAccounts').run(pool);
```

One context in which this may be useful is in emptying a testing database at the start of each test run. Zapatos provides an `AllTables` type to help you ensure that you've listed all your tables:

```typescript:noresult
const allTables: s.AllTables = [
  'appleTransactions', 
  'arrays',
  'authors', 
  'bankAccounts', 
  'books', 
  'doctors',
  'emailAuthentication', 
  'employees', 
  'nameCounts',
  'photos',
  'shifts',
  'stores',
  'subjectPhotos',
  'subjects',
  'tags',
  'usedVoucherCodes',
  'users'
];
```

You can then empty the database like so:

```typescript:norun
// *** DON'T DO THIS IN PRODUCTION! ***
await db.truncate(allTables, 'CASCADE').run(pool);
```

There is also, along similar lines, an `AllMaterializedViews` type.


=> shortcuts.ts /* === select === */

#### `select`, `selectOne`, `selectExactlyOne` and `count`

The `select` shortcut function, in its basic form, takes a `Table` name and some `WHERE` conditions, and returns a `SQLFragment<JSONSelectable[]>`. Those `WHERE` conditions can be the symbol `all` (meaning: no conditions), a `SQLFragment` from a `sql` template string, or the appropriate `Whereable` for the target table (recall that [a `Whereable` can itself contain `SQLFragment` values](#whereable)).

The `selectOne` function does the same except it gives us a `SQLFragment<JSONSelectable | undefined>`, promising _only a single object_ (or `undefined`) when run. 

The `selectExactlyOne` function does the same as `selectOne` but eliminates the `undefined` option (giving `SQLFragment<JSONSelectable>`), because it will instead throw an error (with a helpful `query` property) if it doesn't find a row.

The `count` function, finally, generates a query to count matching rows, and thus returns a `SQLFragment<number>`.

In use, they look like this:

```typescript
// select, no WHERE clause
const allBooks = await db.select('books', db.all).run(pool);
```
```typescript
// select, Whereable
const authorBooks = await db.select('books', { authorId: 1000 }).run(pool);
```
```typescript
// selectOne (since authors.id is a primary key), Whereable
const oneAuthor = await db.selectOne('authors', { id: 1000 }).run(pool);
```
```typescript
// selectExactlyOne, Whereable
// for a more useful example, see the section on `lateral`, below
try {
  const exactlyOneAuthor = await db.selectExactlyOne('authors', { id: 999 }).run(pool);
  // ... do something with this author ...

} catch (err) {
  if (err instanceof db.NotExactlyOneError) console.log(`${err.name}: ${err.message}`);
  else throw err;
}
```
```typescript
// count
const numberOfAuthors = await db.count('authors', db.all).run(pool);
```
```typescript
// select, Whereable with embedded SQLFragment
const recentAuthorBooks = await db.select('books', { 
  authorId: 1001,
  createdAt: db.sql`${db.self} > now() - INTERVAL '7 days'`,
}).run(pool);
```
```typescript
// select, Whereables with conditions helper
const alsoRecentAuthorBooks = await db.select('books', {
  authorId: 1001,
  createdAt: dc.gt(db.sql`now() - INTERVAL '7 days'`),
}).run(pool);
```
```typescript
// select, SQLFragment with embedded Whereables
const anOddSelectionOfBooksToDemonstrateAnOrCondition = await db.select('books', 
  db.sql<s.books.SQL>`${{ id: 1 }} OR ${{ authorId: 2 }}`
).run(pool);
```

Similar to our earlier shortcut examples, once I've typed in `'books'` or `'authors'` as the first argument to the function, TypeScript and VS Code know both how to type-check and auto-complete both the `WHERE` argument and the type that will returned by `run`.

The `select` and `selectOne` shortcuts can also take an `options` object as their third argument, which has a large set of potential keys: `columns`, `order`, `limit`, `offset`, `lateral`, `alias`, `extras`, `groupBy`, `having`, `distinct` and `lock`.


##### `columns`

The `columns` key specifies that we want to return only a subset of columns, perhaps for reasons of efficiency. It takes an array of `Column` names for the appropriate table, and works in just the same way as the `returning` option on the other query types. For example:

```typescript
const bookTitles = await db.select('books', db.all, 
  { columns: ['title'] }).run(pool);
```

The return type is of course appropriately narrowed to the requested columns only, so VS Code will complain if we now try to access `bookTitles[0].authorId`, for example. (Note: this works only when `strictNullChecks` are in operation).

The `columns` option does not enable column aliasing — i.e. you can't use it to do `SELECT "column" AS "aliasedColumn"` or its equivalent — but column aliasing _is_ easily achieved using the `extras` option instead.


##### `order`, `limit` and `offset`

The `limit` and `offset` options each take a number and pass it directly through to SQL `LIMIT` and `OFFSET` clauses. The `order` option takes a single `OrderSpecForTable` or an `OrderSpecForTable[]` array, which has this shape:

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
  order: { by: 'createdAt', direction: 'DESC' }, 
  limit: 1, 
  offset: 1,
}).run(pool);
```

I used destructuring assignment here (`const [lastButOneBook] = /* ... */;`) to account for the fact that I know this query is only going to return one response. Unfortunately, destructuring is just syntactic sugar for indexing, and indexing in TypeScript [doesn't reflect that the result may be undefined](https://github.com/Microsoft/TypeScript/issues/13778) unless you have [`--noUncheckedIndexedAccess`](https://devblogs.microsoft.com/typescript/announcing-typescript-4-1/#no-unchecked-indexed-access) turned on. That means that `lastButOneBook` is now typed as a `JSONSelectable`, but it could actually be `undefined`, and that could lead to errors down the line.

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

We achieve this with an additional `options` key, `lateral`. This `lateral` key takes either a single nested query shortcut, or an object that maps one or more property names to query shortcuts. 

###### `lateral` property maps

Let's deal with the latter case — the map of property names to query shortcuts — first. It allows us to write an even bigger join (of books, each with their author and tags) like so:

```typescript
const booksAuthorTags = await db.select('books', db.all, {
  lateral: {
    author: db.selectExactlyOne('authors', { id: db.parent('authorId') }),
    tags: db.select('tags', { bookId: db.parent('id') }),
  }
}).run(pool);
```

The result here is a `books.JSONSelectable`, augmented with both an `author` property (containing an `authors.JSONSelectable`) and a `tags` property (containing a `tags.JSONSelectable[]` array).

Note that we use `selectExactlyOne` in the nested author query because a book's `authorId` is defined as `NOT NULL REFERENCES "authors"("id")`, and we can therefore be 100% certain that we'll get back a row here.

We could of course turn this around, nesting more deeply to retrieve authors, each with their books, each with their tags:

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

###### `lateral` pass-through

As already mentioned, the `lateral` key can also take a single nested query shortcut. In this case, the result of the lateral query is promoted and passed directly through as the result of the parent query. This can be helpful when working with many-to-many relationships between tables.

For instance, let's say we've got two tables, `photos` and `subjects`, where `subjects` holds data on the people who appear in the photos. This is a many-to-many relationship, since a photo can have many subjects and a subject can be in multiple photos. We model it with a third table, `subjectPhotos`.

Here are the tables:

```sql
CREATE TABLE "photos" 
( "photoId" int PRIMARY KEY GENERATED ALWAYS AS IDENTITY
, "url" text NOT NULL
);
CREATE TABLE "subjects"
( "subjectId" int PRIMARY KEY GENERATED ALWAYS AS IDENTITY
, "name" text NOT NULL
);
CREATE TABLE "subjectPhotos"
( "subjectId" int NOT NULL REFERENCES "subjects"("subjectId")
, "photoId" int NOT NULL REFERENCES "photos"("photoId")
, CONSTRAINT "userPhotosUnique" UNIQUE ("subjectId", "photoId")
);
```

Insert some data:

```typescript
const
  [alice, bobby, cathy] = await db.insert('subjects', [
    { name: 'Alice' }, { name: 'Bobby' }, { name: 'Cathy' },
  ]).run(pool),
  [photo1, photo2, photo3] = await db.insert('photos', [
    { url: 'photo1.jpg' }, { url: 'photo2.jpg' }, { url: 'photo3.jpg' },
  ]).run(pool);

await db.insert('subjectPhotos', [
  { subjectId: alice.subjectId, photoId: photo1.photoId },
  { subjectId: alice.subjectId, photoId: photo2.photoId },
  { subjectId: bobby.subjectId, photoId: photo2.photoId },
  { subjectId: cathy.subjectId, photoId: photo1.photoId },
  { subjectId: cathy.subjectId, photoId: photo3.photoId },
]).run(pool);
```

And now query for all photos with their subjects:

```typescript
const photos = await db.select('photos', db.all, {
  lateral: {
    subjects: db.select('subjectPhotos', { photoId: db.parent('photoId') }, {
      lateral: db.selectExactlyOne('subjects', { subjectId: db.parent('subjectId') })
    })
  }
}).run(pool);
```

Note that the `subjects` subquery is passed directly to the `lateral` option of the `subjectPhotos` query, and its result is therefore passed straight through, effectively overwriting the `subjectPhotos` query result. That's fine, since the `subjectPhotos` table effectively contains only noise here, in the form of duplicate copies of the `photoId` and `subjectId` primary keys.

As seen here, when you pass a nested query directly to the `lateral` option of a parent query, nothing else is returned from that parent query. For this reason, specifying `columns` or `extras` on the parent query would have no effect, and trying to do so will give you a type error.

###### Limitations

There are still a few limitations to type inference for nested queries. First, there's no check that your joins make sense (column types and `REFERENCES` relationships are not exploited in the `Whereable` term). Second, we need to manually specify `selectExactlyOne` instead of `selectOne` when we know that a join will always produce a result — such as when the relevant foreign key is `NOT NULL` and has a `REFERENCES` constraint — which in principle might be inferred for us. Third, note that `strictNullChecks` (or `strict`) must be turned on in `tsconfig.json`, or nothing gets added to the return type.

Nevertheless, this is a handy, flexible — but still transparent and zero-abstraction — way to generate and run complex join queries. 


##### `extras`

The `extras` option allows us to include additional result keys that don't directly replicate the columns of our tables. That can be a computed quantity, such as a geographical distance via [PostGIS](https://postgis.net/), or it can be a simple column alias. 

As is discussed above for `insert`, the `extras` option takes a mapping of property names to column names and/or `sql` template strings (i.e. `SQLFragments`). The `RunResult` type variable of any template string is significant, since it is passed through to the result type.

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
const 
  distance = db.sql<s.stores.SQL, number>`${"geom"} <-> ${db.parent("geom")}`,
  localStore = await db.selectOne('stores', { id: 1 }, {
    columns: ['name'],
    lateral: {
      alternatives: db.select('stores', { id: dc.ne(db.parent("id")) }, {
        alias: 'nearby',
        columns: ['id'],
        extras: { 
          distance,  // <-- i.e. distance: distance, referring to the SQLFragment just defined
          storeName: "name",  // <-- a simple alias for the name column
        },  
        order: { by: distance, direction: 'ASC' },
        limit: 3,
      })
    }
  }).run(pool);
```

The `extras` option requires `strictNullChecks` (or `strict`) to be turned on in `tsconfig.json`.


##### `groupBy` and `having`

The `groupBy` and `having` options work as you'd probably expect. The value of `groupBy` should be a single `Column`, a `Column[]` array or a `SQLFragment`. The value of `having` should be a `Whereable` or `SQLFragment`. 

You'll likely want to use these in conjunction with [`columns`](#columns) and [`extras`](#extras). To take a rather contrived example:

```typescript
const multiBookAuthorTitleData = await db.select('books', db.all, {
  columns: ['authorId'],
  extras: {
    titleCount: db.sql<s.books.SQL, number>`count(${"title"})`,
    titleChars: db.sql<s.books.SQL, number>`sum(char_length(${"title"}))`
  },
  groupBy: 'authorId',
  having: db.sql<s.books.SQL>`count(${"title"}) > 1`,
}).run(pool);
```

##### `distinct`

The `distinct` option, unsurprisingly, adds [`DISTINCT`](https://www.postgresql.org/docs/current/sql-select.html#SQL-DISTINCT) to your query. If `true` it adds only `DISTINCT`. If a single `Column`, a `Column[]` array, or a `SQLFragment`, it adds the appropriate `DISTINCT ON (/* ... */)` clause.

For instance:

```typescript
const 
  books1 = await db.select('books', db.all, { distinct: true }).run(pool),
  books2 = await db.select('books', db.all, { distinct: 'title' }).run(pool),
  books3 = await db.select('books', db.all, { distinct: ['title', 'authorId'] }).run(pool),
  books4 = await db.select('books', db.all, { distinct: db.sql`upper(${"title"})` }).run(pool);
```

(For the `DISTINCT ON` variants, you should really use [`order`](#order-limit-and-offset) too, or you don't really know which rows you'll get).


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


#### `JSONSelectable`

Since the shortcut functions build on Postgres' JSON support, their return values are typed `JSONSelectable` rather than the `Selectable` you'd get back from a manual query (this would not in fact be a hard requirement for all shortcuts, but in the interests of consistency it does apply to all of them).

`JSONSelectable`s differ from `Selectable`s in that some data types that would normally be converted to native JavaScript representations by `pg` are instead returned in the string format produced by the Postgres `to_json` function. Namely:

* Since JSON has no native date representation, columns returned as `Date` values in a `Selectable` are returned as string values in a `JSONSelectable`. These strings are assigned appropriate template types: `DateString`, `TimeString`, `TimeTzString`, `TimestampString` and `TimestampTzString`. For example, `DateString` is defined as ``` `${number}-${number}-${number}` ```. Two helper functions, `toDate()` and `toString()`, are provided to convert between JavaScript's `Date` and some of these string representations, while maintaining nullability and forcing explicit treatment of timezones. For example:

```typescript
const
  d1 = db.toDate('2012-06-01T12:34:00Z'),  // TimestampTzString -> Date
  d2 = db.toDate('2012-06-01T00:00', 'local'),  // TimestampString (Europe/London) -> Date
  d3 = db.toDate('2012-06-01', 'UTC'),  // DateString (UTC) -> Date
  d4 = db.toDate(Math.random() < 0.5 ? null : '2012-10-09T02:34Z') // TimestampTzString | null -> Date | null;

console.log({ d1, d2, d3, d4 });

const
  s1 = db.toString(d1, 'timestamptz'),  // Date -> TimestampTzString
  s2 = db.toString(d2, 'timestamp:local'),  // Date -> TimestampString (Europe/London)
  s3 = db.toString(d3, 'date:UTC'),  // Date -> DateString (UTC)
  s4 = db.toString(Math.random() < 0.5 ? null : d4, 'timestamptz'); // Date | null -> TimestampTzString | null

console.log({ s1, s2, s3, s4 });
```

* `int8` columns are returned as string values (of template string type ``` `${number}` ```) in a `Selectable`, but as numbers in a `JSONSelectable`. This reflects how Postgres natively converts `int8` to JSON, and means these values could overflow `Number.MAX_SAFE_INTEGER`.

* `bytea` columns are returned as `ByteArrayString`, defined as ``` `\\x{string}` ```. A `toBuffer()` function is provided for use with these. For performance and memory reasons, this should not be used for large objects: in that case, consider something like [pg-large-object](https://www.npmjs.com/package/pg-large-object) instead.

* Range types such as `numrange` also get template string types. (Unfortunately, unlike standalone time/date types, which are always returned in ISO8601 format in JSON, time/date bounds in ranges are formatted according to Postgres' current `DateStyle` setting, so can't be typed more specifically than `string`).

If you're using a time/date library such as [Luxon](https://moment.github.io/luxon/) or [Moment](https://momentjs.com/), use Zapatos' `strict` function to roll your own time/date conversions, returning (and inferring) `null` on `null` input. For example:

```typescript
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
```



=> transaction.ts export async function transaction<T, M extends IsolationLevel>(

### `transaction`

```typescript:norun
export enum IsolationLevel {
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
export async function transaction<T, M extends IsolationLevel>(
  txnClientOrPool: pg.Pool | TxnClient<IsolationSatisfying<M>>,
  isolationLevel: M,
  callback: (client: TxnClient<IsolationSatisfying<M>>) => Promise<T>
): Promise<T>
```

The `transaction` helper takes a `pg.Pool` instance, an isolation mode, and an `async` callback function (it can also take a `TxnClient` instead of a `pg.Pool`, but [we'll cover that later](#transaction-sharing)). It then proceeds as follows:

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
const requestLeaveForDoctorOnDay = async (doctorId: number, day: db.DateString) =>
  db.transaction(pool, db.IsolationLevel.Serializable, async txnClient => {
    const otherDoctorsOnShift = await db.count('shifts', {
      doctorId: db.sql`${db.self} != ${db.param(doctorId)}`,
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


#### Transaction isolation shortcuts

To help save keystrokes and line noise, there is a family of transaction shortcut functions named after each isolation mode. For example, instead of:

```typescript:noresult
const result = await db.transaction(pool, db.IsolationLevel.Serializable, async txnClient => { /* ... */ });
```

You can use the equivalent:

```typescript:noresult
const result = await db.serializable(pool, async txnClient => { /* ... */ });
```


#### `IsolationSatisfying` generic

```typescript:norun
export type IsolationSatisfying<T extends IsolationLevel> = {
  [IsolationLevel.Serializable]: IsolationLevel.Serializable;
  [IsolationLevel.RepeatableRead]: IsolationSatisfying<IsolationLevel.Serializable> | IsolationLevel.RepeatableRead;
  /* ... */
}[T];

export type TxnClientForSerializable = TxnClient<IsolationSatisfying<IsolationLevel.Serializable>>;
export type TxnClientForRepeatableRead = TxnClient<IsolationSatisfying<IsolationLevel.RepeatableRead>>;
/* ... */
```

If you find yourself passing transaction clients around, you may find the `IsolationSatisfying` generic useful. For example, if you type a `txnClient` argument to a function as `IsolationSatisfying<IsolationLevel.RepeatableRead>` — probably by using the alias type `TxnClientForRepeatableRead` — you can call it with a client having `IsolationLevel.Serializable` or `IsolationLevel.RepeatableRead` but not `IsolationLevel.ReadCommitted`.


#### Transaction sharing

A snag you might have encountered when using Postgres transactions is that, since transactions can't be nested, it's fiddly to break out SQL operations with cross-cutting isolation requirements into self-contained functions.

Recall the transaction example we began with: a [money transfer between two bank accounts](#transactions). We do this within a transaction, because we need atomicity: we must ensure that either balance A is increased _and_ balance B is correspondingly reduced, or that neither thing happens.

But what if we want to combine some other operations within the same database transaction? Say we want to make two transfers, A to B and A to C, or have both fail. The `transferMoney` function we originally wrote uses a transaction helper to `BEGIN` and `COMMIT` its own transaction every time, so we can't just call it twice.

For this reason, the `transaction` function — and its isolation-level shortcuts — can be passed either a `pg.Pool`, in which case they manage a transaction as decribed above, or an existing `TxnClient`. If they're passed an existing `TxnClient`, they do no more than call the provided callback function with the provided client on the spot.

Let's see how this helps. We'll modify the `transferMoney` function to take a pool or transaction client as its last argument, and pass that straight to the `serializable` transaction function. (Note that we _could_ give this last argument a default value of `pool`, but I find that way it's too easy to accidentally issue queries outside of transactions). 

With that done, we can now use `transferMoney` both for individual transfers, without worrying about transactions, and in combination with other operations, by taking charge of the transaction ourselves:

```typescript
const [accountA, accountB, accountC] = await db.insert('bankAccounts',
  [{ balance: 50 }, { balance: 50 }, { balance: 50 }]).run(pool);

const transferMoney = (sendingAccountId: number, receivingAccountId: number, amount: number, txnClientOrPool: typeof pool | db.TxnClientForSerializable) =>
  db.serializable(txnClientOrPool, txnClient => Promise.all([
    db.update('bankAccounts',
      { balance: db.sql`${db.self} - ${db.param(amount)}` },
      { id: sendingAccountId }).run(txnClient),
    db.update('bankAccounts',
      { balance: db.sql`${db.self} + ${db.param(amount)}` },
      { id: receivingAccountId }).run(txnClient),
  ]));

// single transfer, as before (but passing in `pool`)
try {
  await transferMoney(accountA.id, accountB.id, 60, pool);
} catch (err) {
  console.log(err.message, '/', err.detail);
}

// multiple transfers, passing in an external transaction
try {
  await db.serializable(pool, txnClient => Promise.all([
    transferMoney(accountA.id, accountB.id, 40, txnClient),
    transferMoney(accountA.id, accountC.id, 40, txnClient)
  ]));
} catch (err) {
  console.log(err.message, '/', err.detail);
}

await db.select('bankAccounts', { id: dc.isIn([accountA.id, accountB.id, accountC.id]) }).run(pool);
```

If you expand the results you'll see that both transactions fail, as intended.

Happily, the type system will prevent us from trying to pass `transferMoney` a database client associated with an insufficiently isolated transaction. If we were to substitute `db.serializable` with `db.repeatableRead` inside the second `try` block, TypeScript would complain.


=> pgErrors.ts export function isDatabaseError(err: Error, ...types: (keyof typeof pgErrors)[]) {

### Errors

Zapatos provides a simple function to help you recognise and recover from errors thrown by `pg`.

```typescript:norun
function isDatabaseError(err: Error, ...types: (keyof typeof pgErrors)[]): boolean;
```

You pass it your JS `Error` object, and one or more [Postgres error names](https://www.postgresql.org/docs/current/errcodes-appendix.html). It returns `true` if your error is a `pg` error of any of those kinds, and `false` otherwise. 

It works with both general error class names and specific error names. 

The general class names contain no underscore and correspond to the first two characters of a 5-character Postgres error code: for example, `ConnectionException`, which is all codes starting `08`.

The specific error names contain one underscore and correspond to a full 5-character code: for example, `ConnectionException_ProtocolViolation`, which is code `08P01`.

As one example, the `transaction` helper uses this function to catch serialization problems, like so:

```typescript:norun
try {
  /* start transaction, run queries, commit */

} catch (err) {
  await sql`ROLLBACK`.run(txnClient);
  if (isDatabaseError(err, "TransactionRollback_SerializationFailure", "TransactionRollback_DeadlockDetected")) {
    /* wait a bit, then have another go */

  } else {
    throw err;
  }
}
```

As another example, let's say we're assigning one octet of an IP address by using a `SERIAL` column. We want these to remain sequential up to 254, and then to start filling in any gaps created by deleted rows.

Here's the table:

```sql
CREATE TABLE "users" 
( "id" int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY
, "ipOctet" int NOT NULL UNIQUE CHECK ("ipOctet" BETWEEN 1 AND 254) GENERATED BY DEFAULT AS IDENTITY (MAXVALUE 254)
, "friendlyName" text
);
```

Behind the scenes, 253 rows have already been inserted. Let's delete one so we can see the filling-in process in action:

```typescript
await db.deletes('users', { id: 123 }).run(pool);
```

```typescript
async function createUser(friendlyName: string) {
  return db.serializable(pool, async txnClient => {
    let user;
    try {
      await db.sql`SAVEPOINT start`.run(txnClient);
      user = await db.insert('users', { friendlyName }).run(txnClient);

    } catch (err) {
      if (!db.isDatabaseError(err, 'DataException_SequenceGeneratorLimitExceeded')) throw err;
      
      await db.sql`ROLLBACK TO start`.run(txnClient);
      const ipOctet = await getFirstFreeIpOctet(txnClient);
      if (!ipOctet) return null;

      user = await db.insert('users', { friendlyName, ipOctet }).run(txnClient);
    }
    return user;
  });
}

async function getFirstFreeIpOctet(txnClient: db.TxnClientForSerializable) {
  const result = await db.sql<s.users.SQL, [{ octet: number }] | []>`
    SELECT gs.octet 
    FROM generate_series(1, 254) AS gs(octet) 
    LEFT JOIN ${"users"} AS u ON u.${"ipOctet"} = gs.octet
    WHERE u.${"ipOctet"} IS NULL
    ORDER BY gs.octet ASC LIMIT 1
  `.run(txnClient);

  return result[0]?.octet;
}

const [alice, bob, cathy] = [
  await createUser('Alice'),
  await createUser('Bob'),
  await createUser('Cathy'),
];
console.log(alice, bob, cathy);
```


### Run-time configuration

There are a few configuration options you can set at runtime:

```typescript:norun
export interface Config {
  transactionAttemptsMax: number;
  transactionRetryDelay: { minMs: number; maxMs: number };
  castArrayParamsToJson: boolean;
  castObjectParamsToJson: boolean;
  queryListener?(query: SQLQuery, txnId?: number): void;
  resultListener?(result: any, txnId?: number, elapsedMs?: number): void;
  transactionListener?(message: string, txnId?: number): void;
}
export interface SQLQuery {
  text: string;
  values: any[];
}
```

Read the current values with `getConfig()` and set new values with `setConfig(newConfig: Partial<Config>)`.

* `transactionAttemptsMax` determines how many times the `transaction` helper will try to execute a query in the face of serialization errors before giving up. It defaults to `5`.

* `transactionRetryDelay` determines the range within which the `transaction` helper will pick a random delay before each retry. It's expressed in milliseconds and defaults to `{ minMs: 25, maxMs: 250 }`. 

* `castArrayParamsToJson` and `castObjectParamsToJson` control whether `Parameter` objects containing arrays and objects, respectively, are to be automatically stringified and cast as Postgres `json` when interpolated into a query. Both default to `false`. See further discussion below.

* `queryListener` and `resultListener`, if set, are called from the `run` function, and receive the results of (respectively) compiling and then executing and transforming each query as their first argument. For queries within a transaction, they will be passed a unique numeric transaction ID as their second argument, to aid debugging. The `resultListener` receives a third argument, which is the time the query took (in ms).

* `transactionListener`, similarly, is called with messages about transaction retries, and associated transaction IDs.

You might use one or more of the three listener functions to implement logging. For example, if you're using the [`debug`](https://github.com/visionmedia/debug) library, you could do something like this:

```typescript:norun
const
  queryDebug = debug('db:query'),
  resultDebug = debug('db:result'),
  txnDebug = debug('db:transaction'),
  strFromTxnId = (txnId: number | undefined) => txnId === undefined ? '-' : String(txnId);

db.setConfig({
  queryListener: (query, txnId) =>
    queryDebug(`(%s) %s\n%o`, strFromTxnId(txnId), query.text, query.values),
  resultListener: (result, txnId, elapsedMs) =>
    resultDebug(`(%s, %dms) %O`, strFromTxnId(txnId), elapsedMs?.toFixed(1), result),
  transactionListener: (message, txnId) =>
    txnDebug(`(%s) %s`, strFromTxnId(txnId), message),
});
```

These listeners are also used in generating the _Show generated SQL, results_ elements of this documentation.


#### Casting `Parameters` to JSON

There's [a longstanding gotcha in the `pg` module's treatment of JSON parameters](https://github.com/brianc/node-postgres/issues/2012). For `json` and `jsonb` values, you can pass a JavaScript object directly: `pg` automatically calls `JSON.stringify` for you behind the scenes. But try the same thing with a JavaScript array, and that doesn't happen.

Using `pg` directly here, from Node:

```
> const pg = require('pg');
> const pool = new pg.Pool(/* ... */);
BoundPool { /* ... */ }
> pool.query('INSERT INTO jsontest (data) VALUES ($1)', [{ a: 1, b: 2, c: 3 }]);
Promise { <pending> }
> pool.query('INSERT INTO jsontest (data) VALUES ($1)', [[1, 2, 3]]);
Promise { <pending> }
> (node:59488) UnhandledPromiseRejectionWarning: error: invalid input syntax for type json
```

In this second case, `pg` can't tell whether you're trying to pass a JSON array or a native Postgres array, and it assumes the latter.

But if you know you'll more often be passing JSON arrays than native Postgres arrays to `pg`, you can reverse this assumption by setting the Zapatos `castArrayParamsToJson` config option to `true`. When interpolating a `Parameter` instance (as returned by the `param` call) that wraps an array, Zapatos will then default to calling `JSON.stringify` on the array and casting it to `json`. Whether or not `castArrayParamsToJson` is set, you can always specify the desired stringifying and casting behaviour using the [optional second argument to `param`](#paramvalue-any-cast-boolean--string-parameter).

To clarify, take this table:

```sql
CREATE TABLE "arrays" ("jsonValue" jsonb, "textArray" text[]);
```

When `castArrayParamsToJson` is `false` (the default):

```typescript
db.setConfig({ castArrayParamsToJson: false });  // the default

await db.insert("arrays", { 
  jsonValue: db.param(['a', 'b', 'c'], true),  // true -> manual cast to JSON
  textArray: ['a', 'b', 'c'],
}).run(pool);
```

Or with `castArrayParamsToJson` set to `true`:

```typescript
db.setConfig({ castArrayParamsToJson: true });

await db.insert("arrays", { 
  jsonValue: ['a', 'b', 'c'],
  textArray: db.param(['a', 'b', 'c'], false),  // false -> prevent automatic cast to JSON
}).run(pool);
```

The `castObjectParamsToJson` option has a fairly similar effect. As seen above, `pg` already stringifies JavaScript objects, but it does not explicitly cast them to `json`, and instead passes them implicitly as `text`. This matters in the (probably rare) case that the parameter then requires an onward cast from `json` to another type.

For example, when working with recent PostGIS, casting `geometry` values to JSON produces handy [GeoJSON](https://geojson.org/) output, and you can [define your own cast](https://trac.osgeo.org/postgis/ticket/3687#comment:9) in the opposite direction too. However, when doing a GeoJSON `INSERT` into or `UPDATE` of a `geometry` column, the stringified JSON input parameter must be explicitly cast to JSON, otherwise it's assumed to be [Well-Known Text](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry) and fails to parse. In Zapatos, you can specify the cast manually with the [optional second argument to `param`](#paramvalue-any-cast-boolean--string-parameter), or you can set `castObjectParamsToJson` to `true`, and any JSON objects interpolated as a `Parameter` will be cast to `json` automatically.


## About Zapatos

### Changes

This change list is not comprehensive. For a complete version history, [please see the commit list](https://github.com/jawj/zapatos/commits/master).

#### 4.0

_Breaking change_: Various types in `JSONSelectable`s are now assigned template string types instead of plain old `string`, including date and time types, range types, and `bytea`. For example, pg's `date` maps to a new type `DateString`, now defined as ``` `${number}-${number}-${number}` ```, and `bytea` maps to `ByteArrayString`, which is ``` `\\x${string}` ```. This improves type safety, but some `string` values in existing code may need to be cast or replaced (e.g. with JS `Date` or `Buffer` instances). For the date and time types, new conversion functions `toDate` and `toString` are provided. Or you can roll your own conversions for date libraries such as Luxon and Moment with help from the new `strict` function.

#### 3.6

_New feature_: The `extras` option object can now take column names as well as `SQLFragments` as its values, [enabling straightforward column aliasing](https://github.com/jawj/zapatos/issues/80) (similar to `SELECT "column" AS "aliasedColumn"`) in shortcut functions.

#### 3.5

_Minor features and fixes_: Added `upsert` option `reportAction: 'suppress'` as a workaround for [issues with `xmax`](https://github.com/jawj/zapatos/issues/74). Made schema JSDoc comments [optional](#configure-it). Sorted `UniqueIndex` union types for [stable ordering](https://github.com/jawj/zapatos/issues/76). Moved to (mostly) separate type treatments across `Selectable`, `JSONSelectable`, `Whereable` etc., enabling [proper treatment of `int8` and `Date`](https://github.com/jawj/zapatos/pull/68) in and out of `JSONSelectable`.

#### 3.4

_New features + bugfix_: Added `upsert` shortcut support for `INSERT ... ON CONFLICT ... DO NOTHING` [by passing an empty array as the `updateColumns` option](#insert--on-conflict--do-nothing) (and fixed [a bug](https://github.com/jawj/zapatos/issues/71) where this, and certain other `upsert` queries, would generate invalid SQL). Added [a new `updateValues` option](#updatevalues) for `upsert`. Added the `eq` condition helper, which was [strangely missing](https://github.com/jawj/zapatos/issues/73).

#### 3.3

_New feature_: Added an `updateColumns` option to `upsert`, enabling only a subset of columns to be updated on conflict.

_New feature_: Added an `outExt` generation configuration key, to allow generating `.ts` files instead of `.d.ts` files.

#### 3.2

_New feature_: Types are now generated for materialized views as well as ordinary tables, [thanks to @jtfell](https://github.com/jawj/zapatos/pull/55).

#### 3.1

_New feature_: [Pass-through `lateral` subqueries](#lateral-pass-through), for querying [many-to-many relationships](https://github.com/jawj/zapatos/issues/48).

_New feature_: [As requested](https://github.com/jawj/zapatos/issues/25), you can now manually exclude column keys from the `Insertable` and `Updatable` types, and make column keys optional in `Insertable` types, using a new `"columnOptions"` key in `zapatosconfig.json` or the corresponding `Config` object passed to `generate` ([documentation](#configure-it)). On a similar note, `GENERATED ALWAYS` columns (both the `IDENTITY` and `STORED` varieties) are now automatically excluded from `Insertable` and `Updatable` types, since it's an error to try to write to them.

#### 3.0

_Major breaking change_: Zapatos no longer copies its source to your source tree. In the long run, this is good news — now it's just a normal module, updates won't pollute your diffs, and so on. Thanks are due to [@eyelidlessness](https://github.com/eyelidlessness) and [@jtfell](https://github.com/jtfell).

Right now, though, there's a bit of work to do. When you run `npx zapatos` for the first time in version 3, you'll see a message pointing out that you need to:

* Make sure Zapatos is filed under `"dependencies"` (not `"devDependencies"`) in `package.json`

* Remove the `"srcMode"` key, if present, from `zapatosconfig.json` or the config argument passed to `generate` (this instruction was added in 3.1).

* Delete the old `zapatos/schema.ts` (but leave the new `zapatos/schema.d.ts`).

* Delete the folder `zapatos/src`, and all its contents, which are old copied Zapatos source files.

* Transfer any customised type declarations in `zapatos/custom` from the plain old `.ts` files to the new `.d.ts` files.

* Delete all the plain old `.ts` files in `zapatos/custom`, including `index.ts`.

* Ensure all the `.d.ts` files in `zapatos` are picked up by your TypeScript configuration (e.g. check the `"files"` or `"include"` keys in `tsconfig.json`).

* If you use `ts-node` or `node -r ts-node/register` to run your project, ensure you pass the `--files` option (`ts-node` only) or set `TS_NODE_FILES=true` (either case).

* Make the following changes to your imports (you can use VS Code's 'Replace in Files' command for this, just remember to toggle Regular Expressions on):

```
1) Change:  import * as zapatos from 'zapatos'
   To:      import * as zapatos from 'zapatos/generate'

   Search:  ^(\s*import[^"']*['"])zapatos(["'])
   Replace: $1zapatos/generate$2

2) Change:  import * as db from './path/to/zapatos/src'
   To:      import * as db from 'zapatos/db'

   Search:  ^(\s*import[^"']*['"])[^"']*/zapatos/src(["'])
   Replace: $1zapatos/db$2

3) Change:  import * as s from './path/to/zapatos/schema'
   To:      import type * as s from 'zapatos/schema'
                   ^^^^
                   be sure to import type, not just import

   Search:  ^(\s*import\s*)(type\s*)?([^"']*['"])[^"']+/(zapatos/schema["'])
   Replace: $1type $3$4
```

_Newly documented feature_: the `isDatabaseError` function [is now documented](#errors).

#### 2.0

_New feature_: new `returning` and `extras` options on `insert`, `update`, `upsert` and `deletes` queries. These behave like the `columns` and `extras` options on `select`.

_Breaking change_: the optional last argument to `upsert` is now an options object, when previously it was a list of columns that should not be overwritten with `null` in the case of an `UPDATE`. That column list can now be passed via a `noNullUpdateColumns` key on the new options object.

#### 1.0

_New feature_: [transaction sharing support](#transaction-sharing). Also, for queries within a transaction, a unique numeric transaction ID is now passed as a second argument to the query/result/transaction listeners, to aid debugging.

_Breaking change_: some transaction-related objects have been renamed (hence the jump in [major version](https://semver.org/) to 1.0).

* The `Isolation` enum becomes `IsolationLevel`. 
* The `TxnSatisfying` namespace becomes an `IsolationSatisfying<T extends IsolationLevel>` generic type. So, for example, `TxnSatisfying.Serializable` is rewritten as `IsolationSatisfying<IsolationLevel.Serializable>`. 

Because these are a bit of a mouthful, there are new shortcuts for `TxnClient`, which is the context you'll mainly want to use them in. For example, `TxnClientForSerializable` is an alias for `TxnClient<IsolationSatisfying<IsolationLevel.Serializable>>`.


#### 0.1.57

_New features_: [condition helpers](https://github.com/jawj/zapatos/blob/master/src/db/conditions.ts) for use within `Whereables`, and isolation level-specific [transaction shortcuts](#transaction-isolation-shortcuts).

Condition helpers let you rewrite query conditions like these:

```typescript:noresult
const 
  date = new Date('1989-11-09T18:53:00+0100'),
  authorIds = [1, 2, 3];

const query1a = db.select('books', { createdAt: db.sql`${db.self} >= ${db.param(date)}` });
// can be rewritten as
const query1b = db.select('books', { createdAt: dc.gte(date) });

const query2a = db.select('books', { authorId: db.sql`${db.self} IN (${db.vals(authorIds)})` });
// can be rewritten as
const query2b = db.select('books', { authorId: dc.isIn(authorIds) });
```

New transaction shortcuts per isolation level let you rewrite transactions like this one:

```typescript:noresult
await db.transaction(pool, db.IsolationLevel.Serializable, async txnClient => { /* ... */ });
// can be rewritten as
await db.serializable(pool, async txnClient => { /* ... */ });
```


### This documentation

This document is created from a [separate repository](https://github.com/jawj/zapatos-docs/). All generated SQL has been funnelled through [pgFormatter](https://github.com/darold/pgFormatter) for easier reading.


### Fixes, feature and contributions

If you're asking for or contributing new work, my response is likely to reflect these principles:

**Correct, consistent, comprehensible.**  I'm pretty likely to accept pull requests that fix bugs or improve readability or consistency without any major trade-offs. I'll also do my best to act on clear, minimal test cases that demonstrate unambiguous bugs.

**Small is beautiful.**  I'm less likely to accept pull requests for features that significantly complicate the code base either to address niche use-cases or to eke out minor performance gains that are almost certainly swamped by network and database latencies. 

**Scratching my own itch.**  I'm unlikely to put a lot of my own effort into features I don't currently need ... unless we're talking about paid consultancy, which I'm more than happy to discuss.


### What's next

Nice-to-haves would include:

* **Tests.**  The proprietary server API that's the original consumer of this library, over at [Psychological Technologies](https://www.psyt.co.uk), has a test suite that exercises most of the code base at least a little. Nevertheless, a proper test suite is still kind of indispensable. It should test not just returned values but also inferred types — which is a little fiddly.

* **More complete typing of `lateral` queries.**  It would be great to make use of foreign key relationships and suchlike in generated types and the shortcut functions that make use of them.


### Alternatives

You may find [this excellent overview of TypeScript SQL libraries](https://phiresky.github.io/blog/2020/sql-libs-for-typescript/) useful.


### Licence

This software is released under the [MIT licence](https://opensource.org/licenses/mit-license.php).

Copyright (C) 2020 — 2021 George MacKerron

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

<a href="https://translate.google.com/#view=home&op=translate&sl=es&tl=en&text=zapatos"><img src="zapatos.jpg" width="175" alt="Zapatos = shoes" style="margin-top: 60px; border: none;"></a>


