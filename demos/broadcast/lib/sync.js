console.log("initiate sync")

const chokidar = require('chokidar')
const request = require('request')
const fs = require('fs')

const SECRET = '~~SECRET~~'

chokidar.watch('public', {ignored: /[\/\\]\./})
.on('all', (event, path) => {
  console.log(event, path)

  fs.stat(path, (err, stat) => {
    if(err) throw err

    console.log('>> ' + path)

    if(stat.isFile())
      fs.createReadStream(path)
        // TODO https is possible
        .pipe(request.post(`http://~~URL~~/${SECRET}/${path}`))

    else
      console.log(`skip: ${path}`)
  })

})
