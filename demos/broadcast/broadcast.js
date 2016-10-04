require('./lib/sync')

const Pusher = require('pusher')

const pusher = new Pusher({
  appId:   '~~PUSHER_APP_ID~~',
  key:     '~~PUSHER_KEY~~',
  secret:  '~~PUSHER_SECRET~~',
  cluster: '~~PUSHER_CLUSTER~~',
  encrypted: true
})

pusher.trigger('~~DEMO_KEY~~_broadcast', 'display-text', {
  text: 'Hello world ' + Math.random()
})
