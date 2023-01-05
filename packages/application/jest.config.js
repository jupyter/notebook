const func = require('@jupyterlab/testutils/lib/jest-config');
const upstream = func(__dirname);

const esModules = ['lib0', 'y-protocols'].join('|');

let local = {
  preset: 'ts-jest/presets/js-with-babel',
  transformIgnorePatterns: [
    `/node_modules/(?!${esModules}).+\\.js/(?!(@jupyterlab/.*)/)`
  ],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json'
    }
  }
};

Object.keys(local).forEach(option => {
  upstream[option] = local[option];
});

module.exports = upstream;
