/*
** DON'T EDIT THIS FILE (unless you're working on Zapatos) **
It's part of Zapatos, and will be overwritten when the database schema is regenerated

Zapatos: https://jawj.github.io/zapatos/
Copyright (C) 2020 George MacKerron
Released under the MIT licence: see LICENCE file
*/
let config = {
    transactionAttemptsMax: 5,
    transactionRetryDelay: { minMs: 25, maxMs: 250 },
    castArrayParamsToJson: false,
    castObjectParamsToJson: false,
};
/**
 * Get (a copy of) the current configuration.
 */
export const getConfig = () => (Object.assign({}, config));
/**
 * Set key(s) on the configuration.
 * @param newConfig Partial configuration object
 */
export const setConfig = (newConfig) => config = Object.assign(Object.assign({}, config), newConfig);
