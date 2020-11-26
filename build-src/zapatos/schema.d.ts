/*
** DON'T EDIT THIS FILE **
It's been generated by Zapatos (v3.1.0), and is liable to be overwritten

Zapatos: https://jawj.github.io/zapatos/
Copyright (C) 2020 George MacKerron
Released under the MIT licence: see LICENCE file
*/

declare module 'zapatos/schema' {

  import type * as db from 'zapatos/db';
  import type * as c from 'zapatos/custom';

  // got a type error on schemaVersionCanary below? update by running `npx zapatos`
  export interface schemaVersionCanary extends db.SchemaVersionCanary { version: 101 }

  type JSONSelectableFromSelectable<T> = { [K in keyof T]:
    Date extends T[K] ? Exclude<T[K], Date> | db.DateString :
    Date[] extends T[K] ? Exclude<T[K], Date[]> | db.DateString[] :
    T[K]
  };

  /* === schema: public === */

  /* --- enums --- */

  export type appleEnvironment = 'PROD' | 'Sandbox';
  export namespace every {
    export type appleEnvironment = ['PROD', 'Sandbox'];
  }

  /* --- tables --- */

  export namespace appleTransactions {
    export type Table = 'appleTransactions';
    export interface Selectable {
      environment: appleEnvironment;
      originalTransactionId: string;
      accountId: number;
      latestReceiptData: string | null;
    }
    export interface Whereable {
      environment?: appleEnvironment | db.Parameter<appleEnvironment> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, appleEnvironment | db.Parameter<appleEnvironment> | db.SQLFragment | db.ParentColumn>;
      originalTransactionId?: string | db.Parameter<string> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment | db.ParentColumn>;
      accountId?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
      latestReceiptData?: string | db.Parameter<string> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment | db.ParentColumn>;
    }
    export interface Insertable {
      environment: appleEnvironment | db.Parameter<appleEnvironment> | db.SQLFragment;
      originalTransactionId: string | db.Parameter<string> | db.SQLFragment;
      accountId: number | db.Parameter<number> | db.SQLFragment;
      latestReceiptData?: string | db.Parameter<string> | null | db.DefaultType | db.SQLFragment;
    }
    export interface Updatable {
      environment?: appleEnvironment | db.Parameter<appleEnvironment> | db.SQLFragment | db.SQLFragment<any, appleEnvironment | db.Parameter<appleEnvironment> | db.SQLFragment>;
      originalTransactionId?: string | db.Parameter<string> | db.SQLFragment | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment>;
      accountId?: number | db.Parameter<number> | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment>;
      latestReceiptData?: string | db.Parameter<string> | null | db.DefaultType | db.SQLFragment | db.SQLFragment<any, string | db.Parameter<string> | null | db.DefaultType | db.SQLFragment>;
    }
    export interface JSONSelectable extends JSONSelectableFromSelectable<Selectable> { }
    export type UniqueIndex = 'appleTransactionsPrimaryKey';
    export type Column = keyof Selectable;
    export type OnlyCols<T extends readonly Column[]> = Pick<Selectable, T[number]>;
    export type SQLExpression = db.GenericSQLExpression | db.ColumnNames<Updatable | (keyof Updatable)[]> | db.ColumnValues<Updatable> | Table | Whereable | Column;
    export type SQL = SQLExpression | SQLExpression[];
  }

  export namespace arrays {
    export type Table = 'arrays';
    export interface Selectable {
      jsonValue: db.JSONValue | null;
      textArray: string[] | null;
    }
    export interface Whereable {
      jsonValue?: db.JSONValue | db.Parameter<db.JSONValue> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, db.JSONValue | db.Parameter<db.JSONValue> | db.SQLFragment | db.ParentColumn>;
      textArray?: string[] | db.Parameter<string[]> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, string[] | db.Parameter<string[]> | db.SQLFragment | db.ParentColumn>;
    }
    export interface Insertable {
      jsonValue?: db.JSONValue | db.Parameter<db.JSONValue> | null | db.DefaultType | db.SQLFragment;
      textArray?: string[] | db.Parameter<string[]> | null | db.DefaultType | db.SQLFragment;
    }
    export interface Updatable {
      jsonValue?: db.JSONValue | db.Parameter<db.JSONValue> | null | db.DefaultType | db.SQLFragment | db.SQLFragment<any, db.JSONValue | db.Parameter<db.JSONValue> | null | db.DefaultType | db.SQLFragment>;
      textArray?: string[] | db.Parameter<string[]> | null | db.DefaultType | db.SQLFragment | db.SQLFragment<any, string[] | db.Parameter<string[]> | null | db.DefaultType | db.SQLFragment>;
    }
    export interface JSONSelectable extends JSONSelectableFromSelectable<Selectable> { }
    export type UniqueIndex = never;
    export type Column = keyof Selectable;
    export type OnlyCols<T extends readonly Column[]> = Pick<Selectable, T[number]>;
    export type SQLExpression = db.GenericSQLExpression | db.ColumnNames<Updatable | (keyof Updatable)[]> | db.ColumnValues<Updatable> | Table | Whereable | Column;
    export type SQL = SQLExpression | SQLExpression[];
  }

  export namespace authors {
    export type Table = 'authors';
    export interface Selectable {
      id: number;
      name: string;
      isLiving: boolean | null;
    }
    export interface Whereable {
      id?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
      name?: string | db.Parameter<string> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment | db.ParentColumn>;
      isLiving?: boolean | db.Parameter<boolean> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, boolean | db.Parameter<boolean> | db.SQLFragment | db.ParentColumn>;
    }
    export interface Insertable {
      id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment;
      name: string | db.Parameter<string> | db.SQLFragment;
      isLiving?: boolean | db.Parameter<boolean> | null | db.DefaultType | db.SQLFragment;
    }
    export interface Updatable {
      id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.DefaultType | db.SQLFragment>;
      name?: string | db.Parameter<string> | db.SQLFragment | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment>;
      isLiving?: boolean | db.Parameter<boolean> | null | db.DefaultType | db.SQLFragment | db.SQLFragment<any, boolean | db.Parameter<boolean> | null | db.DefaultType | db.SQLFragment>;
    }
    export interface JSONSelectable extends JSONSelectableFromSelectable<Selectable> { }
    export type UniqueIndex = 'authors_pkey';
    export type Column = keyof Selectable;
    export type OnlyCols<T extends readonly Column[]> = Pick<Selectable, T[number]>;
    export type SQLExpression = db.GenericSQLExpression | db.ColumnNames<Updatable | (keyof Updatable)[]> | db.ColumnValues<Updatable> | Table | Whereable | Column;
    export type SQL = SQLExpression | SQLExpression[];
  }

  export namespace bankAccounts {
    export type Table = 'bankAccounts';
    export interface Selectable {
      id: number;
      balance: number;
    }
    export interface Whereable {
      id?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
      balance?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
    }
    export interface Insertable {
      id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment;
      balance?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment;
    }
    export interface Updatable {
      id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.DefaultType | db.SQLFragment>;
      balance?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.DefaultType | db.SQLFragment>;
    }
    export interface JSONSelectable extends JSONSelectableFromSelectable<Selectable> { }
    export type UniqueIndex = 'bankAccounts_pkey';
    export type Column = keyof Selectable;
    export type OnlyCols<T extends readonly Column[]> = Pick<Selectable, T[number]>;
    export type SQLExpression = db.GenericSQLExpression | db.ColumnNames<Updatable | (keyof Updatable)[]> | db.ColumnValues<Updatable> | Table | Whereable | Column;
    export type SQL = SQLExpression | SQLExpression[];
  }

  export namespace books {
    export type Table = 'books';
    export interface Selectable {
      id: number;
      authorId: number;
      title: string | null;
      createdAt: Date;
    }
    export interface Whereable {
      id?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
      authorId?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
      title?: string | db.Parameter<string> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment | db.ParentColumn>;
      createdAt?: Date | db.Parameter<Date> | db.DateString | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, Date | db.Parameter<Date> | db.DateString | db.SQLFragment | db.ParentColumn>;
    }
    export interface Insertable {
      id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment;
      authorId: number | db.Parameter<number> | db.SQLFragment;
      title?: string | db.Parameter<string> | null | db.DefaultType | db.SQLFragment;
      createdAt?: Date | db.Parameter<Date> | db.DateString | db.DefaultType | db.SQLFragment;
    }
    export interface Updatable {
      id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.DefaultType | db.SQLFragment>;
      authorId?: number | db.Parameter<number> | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment>;
      title?: string | db.Parameter<string> | null | db.DefaultType | db.SQLFragment | db.SQLFragment<any, string | db.Parameter<string> | null | db.DefaultType | db.SQLFragment>;
      createdAt?: Date | db.Parameter<Date> | db.DateString | db.DefaultType | db.SQLFragment | db.SQLFragment<any, Date | db.Parameter<Date> | db.DateString | db.DefaultType | db.SQLFragment>;
    }
    export interface JSONSelectable extends JSONSelectableFromSelectable<Selectable> { }
    export type UniqueIndex = 'books_pkey';
    export type Column = keyof Selectable;
    export type OnlyCols<T extends readonly Column[]> = Pick<Selectable, T[number]>;
    export type SQLExpression = db.GenericSQLExpression | db.ColumnNames<Updatable | (keyof Updatable)[]> | db.ColumnValues<Updatable> | Table | Whereable | Column;
    export type SQL = SQLExpression | SQLExpression[];
  }

  export namespace doctors {
    export type Table = 'doctors';
    export interface Selectable {
      id: number;
      name: string;
    }
    export interface Whereable {
      id?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
      name?: string | db.Parameter<string> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment | db.ParentColumn>;
    }
    export interface Insertable {
      id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment;
      name: string | db.Parameter<string> | db.SQLFragment;
    }
    export interface Updatable {
      id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.DefaultType | db.SQLFragment>;
      name?: string | db.Parameter<string> | db.SQLFragment | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment>;
    }
    export interface JSONSelectable extends JSONSelectableFromSelectable<Selectable> { }
    export type UniqueIndex = 'doctors_pkey';
    export type Column = keyof Selectable;
    export type OnlyCols<T extends readonly Column[]> = Pick<Selectable, T[number]>;
    export type SQLExpression = db.GenericSQLExpression | db.ColumnNames<Updatable | (keyof Updatable)[]> | db.ColumnValues<Updatable> | Table | Whereable | Column;
    export type SQL = SQLExpression | SQLExpression[];
  }

  export namespace emailAuthentication {
    export type Table = 'emailAuthentication';
    export interface Selectable {
      email: string;
      consecutiveFailedLogins: number;
      lastFailedLogin: Date | null;
    }
    export interface Whereable {
      email?: string | db.Parameter<string> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment | db.ParentColumn>;
      consecutiveFailedLogins?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
      lastFailedLogin?: Date | db.Parameter<Date> | db.DateString | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, Date | db.Parameter<Date> | db.DateString | db.SQLFragment | db.ParentColumn>;
    }
    export interface Insertable {
      email: string | db.Parameter<string> | db.SQLFragment;
      consecutiveFailedLogins?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment;
      lastFailedLogin?: Date | db.Parameter<Date> | db.DateString | null | db.DefaultType | db.SQLFragment;
    }
    export interface Updatable {
      email?: string | db.Parameter<string> | db.SQLFragment | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment>;
      consecutiveFailedLogins?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.DefaultType | db.SQLFragment>;
      lastFailedLogin?: Date | db.Parameter<Date> | db.DateString | null | db.DefaultType | db.SQLFragment | db.SQLFragment<any, Date | db.Parameter<Date> | db.DateString | null | db.DefaultType | db.SQLFragment>;
    }
    export interface JSONSelectable extends JSONSelectableFromSelectable<Selectable> { }
    export type UniqueIndex = 'emailAuthentication_pkey';
    export type Column = keyof Selectable;
    export type OnlyCols<T extends readonly Column[]> = Pick<Selectable, T[number]>;
    export type SQLExpression = db.GenericSQLExpression | db.ColumnNames<Updatable | (keyof Updatable)[]> | db.ColumnValues<Updatable> | Table | Whereable | Column;
    export type SQL = SQLExpression | SQLExpression[];
  }

  export namespace employees {
    export type Table = 'employees';
    export interface Selectable {
      id: number;
      name: string;
      managerId: number | null;
    }
    export interface Whereable {
      id?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
      name?: string | db.Parameter<string> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment | db.ParentColumn>;
      managerId?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
    }
    export interface Insertable {
      id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment;
      name: string | db.Parameter<string> | db.SQLFragment;
      managerId?: number | db.Parameter<number> | null | db.DefaultType | db.SQLFragment;
    }
    export interface Updatable {
      id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.DefaultType | db.SQLFragment>;
      name?: string | db.Parameter<string> | db.SQLFragment | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment>;
      managerId?: number | db.Parameter<number> | null | db.DefaultType | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | null | db.DefaultType | db.SQLFragment>;
    }
    export interface JSONSelectable extends JSONSelectableFromSelectable<Selectable> { }
    export type UniqueIndex = 'employees_pkey';
    export type Column = keyof Selectable;
    export type OnlyCols<T extends readonly Column[]> = Pick<Selectable, T[number]>;
    export type SQLExpression = db.GenericSQLExpression | db.ColumnNames<Updatable | (keyof Updatable)[]> | db.ColumnValues<Updatable> | Table | Whereable | Column;
    export type SQL = SQLExpression | SQLExpression[];
  }

  export namespace photos {
    export type Table = 'photos';
    export interface Selectable {
      photoId: number;
      url: string;
    }
    export interface Whereable {
      photoId?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
      url?: string | db.Parameter<string> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment | db.ParentColumn>;
    }
    export interface Insertable {
      photoId?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment;
      url: string | db.Parameter<string> | db.SQLFragment;
    }
    export interface Updatable {
      photoId?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.DefaultType | db.SQLFragment>;
      url?: string | db.Parameter<string> | db.SQLFragment | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment>;
    }
    export interface JSONSelectable extends JSONSelectableFromSelectable<Selectable> { }
    export type UniqueIndex = 'photos_pkey';
    export type Column = keyof Selectable;
    export type OnlyCols<T extends readonly Column[]> = Pick<Selectable, T[number]>;
    export type SQLExpression = db.GenericSQLExpression | db.ColumnNames<Updatable | (keyof Updatable)[]> | db.ColumnValues<Updatable> | Table | Whereable | Column;
    export type SQL = SQLExpression | SQLExpression[];
  }

  export namespace shifts {
    export type Table = 'shifts';
    export interface Selectable {
      day: Date;
      doctorId: number;
    }
    export interface Whereable {
      day?: Date | db.Parameter<Date> | db.DateString | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, Date | db.Parameter<Date> | db.DateString | db.SQLFragment | db.ParentColumn>;
      doctorId?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
    }
    export interface Insertable {
      day: Date | db.Parameter<Date> | db.DateString | db.SQLFragment;
      doctorId: number | db.Parameter<number> | db.SQLFragment;
    }
    export interface Updatable {
      day?: Date | db.Parameter<Date> | db.DateString | db.SQLFragment | db.SQLFragment<any, Date | db.Parameter<Date> | db.DateString | db.SQLFragment>;
      doctorId?: number | db.Parameter<number> | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment>;
    }
    export interface JSONSelectable extends JSONSelectableFromSelectable<Selectable> { }
    export type UniqueIndex = 'shifts_pkey';
    export type Column = keyof Selectable;
    export type OnlyCols<T extends readonly Column[]> = Pick<Selectable, T[number]>;
    export type SQLExpression = db.GenericSQLExpression | db.ColumnNames<Updatable | (keyof Updatable)[]> | db.ColumnValues<Updatable> | Table | Whereable | Column;
    export type SQL = SQLExpression | SQLExpression[];
  }

  export namespace stores {
    export type Table = 'stores';
    export interface Selectable {
      id: number;
      name: string;
      geom: c.PgGeometry;
    }
    export interface Whereable {
      id?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
      name?: string | db.Parameter<string> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment | db.ParentColumn>;
      geom?: c.PgGeometry | db.Parameter<c.PgGeometry> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, c.PgGeometry | db.Parameter<c.PgGeometry> | db.SQLFragment | db.ParentColumn>;
    }
    export interface Insertable {
      id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment;
      name: string | db.Parameter<string> | db.SQLFragment;
      geom: c.PgGeometry | db.Parameter<c.PgGeometry> | db.SQLFragment;
    }
    export interface Updatable {
      id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.DefaultType | db.SQLFragment>;
      name?: string | db.Parameter<string> | db.SQLFragment | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment>;
      geom?: c.PgGeometry | db.Parameter<c.PgGeometry> | db.SQLFragment | db.SQLFragment<any, c.PgGeometry | db.Parameter<c.PgGeometry> | db.SQLFragment>;
    }
    export interface JSONSelectable extends JSONSelectableFromSelectable<Selectable> { }
    export type UniqueIndex = 'stores_pkey';
    export type Column = keyof Selectable;
    export type OnlyCols<T extends readonly Column[]> = Pick<Selectable, T[number]>;
    export type SQLExpression = db.GenericSQLExpression | db.ColumnNames<Updatable | (keyof Updatable)[]> | db.ColumnValues<Updatable> | Table | Whereable | Column;
    export type SQL = SQLExpression | SQLExpression[];
  }

  export namespace subjectPhotos {
    export type Table = 'subjectPhotos';
    export interface Selectable {
      subjectId: number;
      photoId: number;
    }
    export interface Whereable {
      subjectId?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
      photoId?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
    }
    export interface Insertable {
      subjectId: number | db.Parameter<number> | db.SQLFragment;
      photoId: number | db.Parameter<number> | db.SQLFragment;
    }
    export interface Updatable {
      subjectId?: number | db.Parameter<number> | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment>;
      photoId?: number | db.Parameter<number> | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment>;
    }
    export interface JSONSelectable extends JSONSelectableFromSelectable<Selectable> { }
    export type UniqueIndex = 'userphotosunique';
    export type Column = keyof Selectable;
    export type OnlyCols<T extends readonly Column[]> = Pick<Selectable, T[number]>;
    export type SQLExpression = db.GenericSQLExpression | db.ColumnNames<Updatable | (keyof Updatable)[]> | db.ColumnValues<Updatable> | Table | Whereable | Column;
    export type SQL = SQLExpression | SQLExpression[];
  }

  export namespace subjects {
    export type Table = 'subjects';
    export interface Selectable {
      subjectId: number;
      name: string;
    }
    export interface Whereable {
      subjectId?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
      name?: string | db.Parameter<string> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment | db.ParentColumn>;
    }
    export interface Insertable {
      subjectId?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment;
      name: string | db.Parameter<string> | db.SQLFragment;
    }
    export interface Updatable {
      subjectId?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.DefaultType | db.SQLFragment>;
      name?: string | db.Parameter<string> | db.SQLFragment | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment>;
    }
    export interface JSONSelectable extends JSONSelectableFromSelectable<Selectable> { }
    export type UniqueIndex = 'subjects_pkey';
    export type Column = keyof Selectable;
    export type OnlyCols<T extends readonly Column[]> = Pick<Selectable, T[number]>;
    export type SQLExpression = db.GenericSQLExpression | db.ColumnNames<Updatable | (keyof Updatable)[]> | db.ColumnValues<Updatable> | Table | Whereable | Column;
    export type SQL = SQLExpression | SQLExpression[];
  }

  export namespace tags {
    export type Table = 'tags';
    export interface Selectable {
      tag: string;
      bookId: number;
    }
    export interface Whereable {
      tag?: string | db.Parameter<string> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment | db.ParentColumn>;
      bookId?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
    }
    export interface Insertable {
      tag: string | db.Parameter<string> | db.SQLFragment;
      bookId: number | db.Parameter<number> | db.SQLFragment;
    }
    export interface Updatable {
      tag?: string | db.Parameter<string> | db.SQLFragment | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment>;
      bookId?: number | db.Parameter<number> | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment>;
    }
    export interface JSONSelectable extends JSONSelectableFromSelectable<Selectable> { }
    export type UniqueIndex = 'tagsUniqueIdx';
    export type Column = keyof Selectable;
    export type OnlyCols<T extends readonly Column[]> = Pick<Selectable, T[number]>;
    export type SQLExpression = db.GenericSQLExpression | db.ColumnNames<Updatable | (keyof Updatable)[]> | db.ColumnValues<Updatable> | Table | Whereable | Column;
    export type SQL = SQLExpression | SQLExpression[];
  }

  export namespace users {
    export type Table = 'users';
    export interface Selectable {
      id: number;
      ipOctet: number;
      friendlyName: string | null;
    }
    export interface Whereable {
      id?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
      ipOctet?: number | db.Parameter<number> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, number | db.Parameter<number> | db.SQLFragment | db.ParentColumn>;
      friendlyName?: string | db.Parameter<string> | db.SQLFragment | db.ParentColumn | db.SQLFragment<any, string | db.Parameter<string> | db.SQLFragment | db.ParentColumn>;
    }
    export interface Insertable {
      id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment;
      ipOctet?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment;
      friendlyName?: string | db.Parameter<string> | null | db.DefaultType | db.SQLFragment;
    }
    export interface Updatable {
      id?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.DefaultType | db.SQLFragment>;
      ipOctet?: number | db.Parameter<number> | db.DefaultType | db.SQLFragment | db.SQLFragment<any, number | db.Parameter<number> | db.DefaultType | db.SQLFragment>;
      friendlyName?: string | db.Parameter<string> | null | db.DefaultType | db.SQLFragment | db.SQLFragment<any, string | db.Parameter<string> | null | db.DefaultType | db.SQLFragment>;
    }
    export interface JSONSelectable extends JSONSelectableFromSelectable<Selectable> { }
    export type UniqueIndex = 'users_pkey' | 'users_ipOctet_key';
    export type Column = keyof Selectable;
    export type OnlyCols<T extends readonly Column[]> = Pick<Selectable, T[number]>;
    export type SQLExpression = db.GenericSQLExpression | db.ColumnNames<Updatable | (keyof Updatable)[]> | db.ColumnValues<Updatable> | Table | Whereable | Column;
    export type SQL = SQLExpression | SQLExpression[];
  }

  /* === cross-table types === */

  export type Table = appleTransactions.Table | arrays.Table | authors.Table | bankAccounts.Table | books.Table | doctors.Table | emailAuthentication.Table | employees.Table | photos.Table | shifts.Table | stores.Table | subjectPhotos.Table | subjects.Table | tags.Table | users.Table;
  export type Selectable = appleTransactions.Selectable | arrays.Selectable | authors.Selectable | bankAccounts.Selectable | books.Selectable | doctors.Selectable | emailAuthentication.Selectable | employees.Selectable | photos.Selectable | shifts.Selectable | stores.Selectable | subjectPhotos.Selectable | subjects.Selectable | tags.Selectable | users.Selectable;
  export type Whereable = appleTransactions.Whereable | arrays.Whereable | authors.Whereable | bankAccounts.Whereable | books.Whereable | doctors.Whereable | emailAuthentication.Whereable | employees.Whereable | photos.Whereable | shifts.Whereable | stores.Whereable | subjectPhotos.Whereable | subjects.Whereable | tags.Whereable | users.Whereable;
  export type Insertable = appleTransactions.Insertable | arrays.Insertable | authors.Insertable | bankAccounts.Insertable | books.Insertable | doctors.Insertable | emailAuthentication.Insertable | employees.Insertable | photos.Insertable | shifts.Insertable | stores.Insertable | subjectPhotos.Insertable | subjects.Insertable | tags.Insertable | users.Insertable;
  export type Updatable = appleTransactions.Updatable | arrays.Updatable | authors.Updatable | bankAccounts.Updatable | books.Updatable | doctors.Updatable | emailAuthentication.Updatable | employees.Updatable | photos.Updatable | shifts.Updatable | stores.Updatable | subjectPhotos.Updatable | subjects.Updatable | tags.Updatable | users.Updatable;
  export type UniqueIndex = appleTransactions.UniqueIndex | arrays.UniqueIndex | authors.UniqueIndex | bankAccounts.UniqueIndex | books.UniqueIndex | doctors.UniqueIndex | emailAuthentication.UniqueIndex | employees.UniqueIndex | photos.UniqueIndex | shifts.UniqueIndex | stores.UniqueIndex | subjectPhotos.UniqueIndex | subjects.UniqueIndex | tags.UniqueIndex | users.UniqueIndex;
  export type Column = appleTransactions.Column | arrays.Column | authors.Column | bankAccounts.Column | books.Column | doctors.Column | emailAuthentication.Column | employees.Column | photos.Column | shifts.Column | stores.Column | subjectPhotos.Column | subjects.Column | tags.Column | users.Column;
  export type AllTables = [appleTransactions.Table, arrays.Table, authors.Table, bankAccounts.Table, books.Table, doctors.Table, emailAuthentication.Table, employees.Table, photos.Table, shifts.Table, stores.Table, subjectPhotos.Table, subjects.Table, tags.Table, users.Table];


  export type SelectableForTable<T extends Table> = {
    appleTransactions: appleTransactions.Selectable;
    arrays: arrays.Selectable;
    authors: authors.Selectable;
    bankAccounts: bankAccounts.Selectable;
    books: books.Selectable;
    doctors: doctors.Selectable;
    emailAuthentication: emailAuthentication.Selectable;
    employees: employees.Selectable;
    photos: photos.Selectable;
    shifts: shifts.Selectable;
    stores: stores.Selectable;
    subjectPhotos: subjectPhotos.Selectable;
    subjects: subjects.Selectable;
    tags: tags.Selectable;
    users: users.Selectable;
  }[T];

  export type WhereableForTable<T extends Table> = {
    appleTransactions: appleTransactions.Whereable;
    arrays: arrays.Whereable;
    authors: authors.Whereable;
    bankAccounts: bankAccounts.Whereable;
    books: books.Whereable;
    doctors: doctors.Whereable;
    emailAuthentication: emailAuthentication.Whereable;
    employees: employees.Whereable;
    photos: photos.Whereable;
    shifts: shifts.Whereable;
    stores: stores.Whereable;
    subjectPhotos: subjectPhotos.Whereable;
    subjects: subjects.Whereable;
    tags: tags.Whereable;
    users: users.Whereable;
  }[T];

  export type InsertableForTable<T extends Table> = {
    appleTransactions: appleTransactions.Insertable;
    arrays: arrays.Insertable;
    authors: authors.Insertable;
    bankAccounts: bankAccounts.Insertable;
    books: books.Insertable;
    doctors: doctors.Insertable;
    emailAuthentication: emailAuthentication.Insertable;
    employees: employees.Insertable;
    photos: photos.Insertable;
    shifts: shifts.Insertable;
    stores: stores.Insertable;
    subjectPhotos: subjectPhotos.Insertable;
    subjects: subjects.Insertable;
    tags: tags.Insertable;
    users: users.Insertable;
  }[T];

  export type UpdatableForTable<T extends Table> = {
    appleTransactions: appleTransactions.Updatable;
    arrays: arrays.Updatable;
    authors: authors.Updatable;
    bankAccounts: bankAccounts.Updatable;
    books: books.Updatable;
    doctors: doctors.Updatable;
    emailAuthentication: emailAuthentication.Updatable;
    employees: employees.Updatable;
    photos: photos.Updatable;
    shifts: shifts.Updatable;
    stores: stores.Updatable;
    subjectPhotos: subjectPhotos.Updatable;
    subjects: subjects.Updatable;
    tags: tags.Updatable;
    users: users.Updatable;
  }[T];

  export type UniqueIndexForTable<T extends Table> = {
    appleTransactions: appleTransactions.UniqueIndex;
    arrays: arrays.UniqueIndex;
    authors: authors.UniqueIndex;
    bankAccounts: bankAccounts.UniqueIndex;
    books: books.UniqueIndex;
    doctors: doctors.UniqueIndex;
    emailAuthentication: emailAuthentication.UniqueIndex;
    employees: employees.UniqueIndex;
    photos: photos.UniqueIndex;
    shifts: shifts.UniqueIndex;
    stores: stores.UniqueIndex;
    subjectPhotos: subjectPhotos.UniqueIndex;
    subjects: subjects.UniqueIndex;
    tags: tags.UniqueIndex;
    users: users.UniqueIndex;
  }[T];

  export type ColumnForTable<T extends Table> = {
    appleTransactions: appleTransactions.Column;
    arrays: arrays.Column;
    authors: authors.Column;
    bankAccounts: bankAccounts.Column;
    books: books.Column;
    doctors: doctors.Column;
    emailAuthentication: emailAuthentication.Column;
    employees: employees.Column;
    photos: photos.Column;
    shifts: shifts.Column;
    stores: stores.Column;
    subjectPhotos: subjectPhotos.Column;
    subjects: subjects.Column;
    tags: tags.Column;
    users: users.Column;
  }[T];

  export type SQLForTable<T extends Table> = {
    appleTransactions: appleTransactions.SQL;
    arrays: arrays.SQL;
    authors: authors.SQL;
    bankAccounts: bankAccounts.SQL;
    books: books.SQL;
    doctors: doctors.SQL;
    emailAuthentication: emailAuthentication.SQL;
    employees: employees.SQL;
    photos: photos.SQL;
    shifts: shifts.SQL;
    stores: stores.SQL;
    subjectPhotos: subjectPhotos.SQL;
    subjects: subjects.SQL;
    tags: tags.SQL;
    users: users.SQL;
  }[T];

}
