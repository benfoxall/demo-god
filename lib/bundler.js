const tar = require('tar-fs')
const fs = require('fs')
const path = require('path')
const replace = require('replacestream')
const zlib = require('zlib')

function bundler(dir, replacements) {

  const replaceFn = replace(
    /__\.([A-Z_]+)\b/g,
    (r, key) => replacements[key] || r
  )

  return tar.pack(dir, {

    ignore: f => f.endsWith('.DS_Store'),

    // The size of the file changes so we have to update the header
    mapStream: (stream, header) => {
      var size = 0
      return stream
        .pipe(replaceFn)
          .on('data', chunk => size += chunk.length)
          .on('end', _ => header.size = size)
    }

  })
  .pipe(zlib.Gzip())

}


module.exports = bundler
