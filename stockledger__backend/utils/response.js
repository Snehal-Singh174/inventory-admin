'use strict';

/**
 * Send a single data payload.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {number} [status=200]
 */
function sendData(res, data, status) {
  const s = status || 200;
  res.status(s).json({ data, status: s });
}

/**
 * Send a paginated list with metadata.
 * @param {import('express').Response} res
 * @param {Array} data
 * @param {{ total: number, page: number, pageSize: number }} meta
 */
function sendList(res, data, meta) {
  res.status(200).json({ data, meta, status: 200 });
}

/**
 * Create a structured application error with HTTP status and code.
 * @param {string} message
 * @param {number} [status=500]
 * @param {string} [code='INTERNAL_ERROR']
 * @returns {Error}
 */
function appError(message, status, code) {
  const err = new Error(message);
  err.status = status || 500;
  err.code = code || 'INTERNAL_ERROR';
  return err;
}

module.exports = { sendData, sendList, appError };
