/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

const base = require('./rspack.config');

module.exports = [
  {
    ...base[0],
    bail: false,
    watch: true,
  },
  ...base.slice(1),
];
