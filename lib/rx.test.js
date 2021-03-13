const { findPort } = require('./rx')

findPort({ path: 'foo' }).subscribe(console.log)
