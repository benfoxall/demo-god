const program = require('commander')
const mkdirp = require('mkdirp')
const slug = require('./lib/slug')

program
  .version(require('./package.json').version)
  .usage('[options] url')
  .option('-s, --secret [token]', 'secret token')
  .option('-i, --install', 'install the demo locally')
  .parse(process.argv)

console.log(program)


// GET url/demo.zip
