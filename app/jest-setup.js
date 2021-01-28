const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

module.exports = async () => {
  const data = path.join(__dirname, './test/data');
  const example = path.join(__dirname, '../binder/example.ipynb');
  const dest = path.join(data, 'example.ipynb');

  rimraf.sync(data);
  fs.mkdirSync(data);
  fs.copyFileSync(example, dest);
};
