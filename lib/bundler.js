const tar = require('tar-fs')
const fs = require('fs')
const path = require('path')
const replace = require('replacestream')
const zlib = require('zlib')
const tmp = require('tmp')
const ndir = require('node-dir');
const tarstream = require('tar-stream')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')

function bundler(dir, replacements, res) {

  // create a temporary directory
  tmp.dir(function _tempDirCreated(err, tmpPath, tmpCleanup) {
    if (err) throw err

    console.log("tmp dir: ", tmpPath)

    ndir.readFilesStream(dir,
      { exclude: /\.DS_Store$/ },
      function(err, stream, next) {

        // console.log("READING…", dir, stream.path, tmpPath)

        const target = tmpPath + '/' + stream.path

        mkdirp(path.dirname(target), function(err){
          if (err) throw err

          const write = fs.createWriteStream(tmpPath + '/' + stream.path)

          stream
            .pipe(replace(
              /~~([A-Z_]+)~~/g,
              (r, key) => replacements[key] || r
            ))
            .pipe(write)

          stream
            .on('end', next)

        })

      },
      function(err, files){
          if (err) throw err

          tar
            .pack(tmpPath + '/' + dir)
            .on('end', _ => rimraf(tmpPath, _ => console.log(`removed ${tmpPath}`)))
            .pipe(res)


      }
    )

  })


  return

}

module.exports = bundler
