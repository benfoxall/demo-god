require('./lib/sync')

const Pusher = require('pusher')

const pusher = new Pusher({
  appId:   '~~PUSHER_APP_ID~~',
  key:     '~~PUSHER_KEY~~',
  secret:  '~~PUSHER_SECRET~~',
  cluster: '~~PUSHER_CLUSTER~~',
  encrypted: true
})


const repl = require('repl')
repl.start({
  prompt: '>',
  input: process.stdin,
  output: process.stdout
})
.context.pusher = pusher
