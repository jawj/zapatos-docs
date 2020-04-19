/* tslint:disable */
;
let config = {
    transactionAttemptsMax: 5,
    transactionRetryDelay: { minMs: 25, maxMs: 250 },
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
