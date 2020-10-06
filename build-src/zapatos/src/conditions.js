import { SQLFragment, ParentColumn, Parameter, param, sql, self, vals, } from './core';
import { mapWithSeparator } from './utils';
const conditionalParam = (a) => a instanceof SQLFragment || a instanceof ParentColumn || a instanceof Parameter ? a : param(a);
export const isNull = sql `${self} IS NULL`;
export const isNotNull = sql `${self} IS NOT NULL`;
export const isTrue = sql `${self} IS TRUE`;
export const isNotTrue = sql `${self} IS NOT TRUE`;
export const isFalse = sql `${self} IS FALSE`;
export const isNotFalse = sql `${self} IS NOT FALSE`;
export const isUnknown = sql `${self} IS UNKNOWN`;
export const isNotUnknown = sql `${self} IS NOT UNKNOWN`;
export const isDistinctFrom = (a) => sql `${self} IS DISTINCT FROM ${conditionalParam(a)}`;
export const isNotDistinctFrom = (a) => sql `${self} IS NOT DISTINCT FROM ${conditionalParam(a)}`;
export const ne = (a) => sql `${self} <> ${conditionalParam(a)}`;
export const gt = (a) => sql `${self} > ${conditionalParam(a)}`;
export const gte = (a) => sql `${self} >= ${conditionalParam(a)}`;
export const lt = (a) => sql `${self} < ${conditionalParam(a)}`;
export const lte = (a) => sql `${self} <= ${conditionalParam(a)}`;
export const between = (a, b) => sql `${self} BETWEEN (${conditionalParam(a)}) AND (${conditionalParam(b)})`;
export const betweenSymmetric = (a, b) => sql `${self} BETWEEN SYMMETRIC (${conditionalParam(a)}) AND (${conditionalParam(b)})`;
export const notBetween = (a, b) => sql `${self} NOT BETWEEN (${conditionalParam(a)}) AND (${conditionalParam(b)})`;
export const notBetweenSymmetric = (a, b) => sql `${self} NOT BETWEEN SYMMETRIC (${conditionalParam(a)}) AND (${conditionalParam(b)})`;
export const isIn = (a) => sql `${self} IN (${vals(a)})`;
export const isNotIn = (a) => sql `${self} NOT IN (${vals(a)})`;
export const like = (a) => sql `${self} LIKE ${conditionalParam(a)}`;
export const notLike = (a) => sql `${self} NOT LIKE ${conditionalParam(a)}`;
export const ilike = (a) => sql `${self} ILIKE ${conditionalParam(a)}`;
export const notIlike = (a) => sql `${self} NOT ILIKE ${conditionalParam(a)}`;
export const similarTo = (a) => sql `${self} SIMILAR TO ${conditionalParam(a)}`;
export const notSimilarTo = (a) => sql `${self} SIMILAR TO ${conditionalParam(a)}`;
export const reMatch = (a) => sql `${self} ~ ${conditionalParam(a)}`;
export const reImatch = (a) => sql `${self} ~* ${conditionalParam(a)}`;
export const notReMatch = (a) => sql `${self} !~ ${conditionalParam(a)}`;
export const notReImatch = (a) => sql `${self} !~* ${conditionalParam(a)}`;
export const or = (...conditions) => sql `(${mapWithSeparator(conditions, sql ` OR `, c => c)})`;
export const and = (...conditions) => sql `(${mapWithSeparator(conditions, sql ` AND `, c => c)})`;
export const not = (condition) => sql `(NOT ${condition})`;
