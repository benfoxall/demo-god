require('dotenv').config({silent: true})

const express = require('express')
const passport = require('passport')
const Redis = require('ioredis')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const crypto = require('crypto')

const slugValidator = require('./lib/slug')
const bundler = require('./lib/bundler')

const app = express()
const redis = new Redis(process.env.REDIS_URL)

// serve static files before everything else
app.use(express.static('static'))

app.use(require('cookie-parser')())
app.use(require('body-parser').urlencoded({ extended: true }))
app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  store: new RedisStore({
    client: redis
  })
}))

app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(function(user, done) {
  redis.set(`user:${user.id}`, user._raw, function(err, data){
    done(err, user.id)
  })
})

passport.deserializeUser(function(id, done) {
  redis.get(`user:${id}`, function(err, data){
    done(err, JSON.parse(data))
  })
})

var GoogleStrategy = require('passport-google-oauth20').Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    hd: 'pusher.com'
  },
  function(accessToken, refreshToken, profile, cb) {
    if(profile._json.domain != 'pusher.com') {
      console.error("Non pusher.com login attempt: ", JSON.stringify(profile._json) )
      cb("Must be a pusher.com address")
    } else {
      cb(null, profile)
    }

  }
))

app.get('/login', passport.authenticate('google', { scope: ['profile', 'email'] }))

app.get('/callback',
  passport.authenticate('google'),
  (req, res) => res.redirect('/new')
)

app.get('/logout', function(req, res){
  req.logout()
  res.redirect('/')
})


app.set('view engine', 'pug')

app.get('/',    (req, res) => res.render('index', {user: req.user}))
app.get('/new', (req, res) => res.render('new', {user: req.user}))
app.post('/new', (req, res) => {

  const slug = req.body.slug

  // slug is valid
  Promise.resolve(slug)

  .then(slugValidator)

  // user is allowed
  .then(_ => {
    if(!req.user) throw "Not authorised"
  })


  // slug hasn't been taken
  .then(_ =>
    redis.exists(`demo:${slug}`)
      .then(result => {
        if(result) throw "Already taken"
        return slug
      })
  )

  // create it
  .then(_ => {
      redis.set(`demo:${slug}`, JSON.stringify({
        secret: crypto.randomBytes(32).toString('hex'),
        user: req.user.id,
        pusher: {
          config: 'here'
        }
      }))
    }
  )

  .then(_ => res.redirect(`/${slug}`))

  .catch( error =>
    res.render('new', {
      user: req.user,
      error: error,
      slug: slug
    })
  )

})

app.listen(process.env.PORT || 3000)



// potentially a demo
app.get('/:key', (req, res, next) => {

  var key = req.params.key

  try {
    slugValidator(key)
  } catch (e) {
    return next()
  }

  const path = '/' + key
  const url = req.get('host') + path

  Promise.all([
    redis.get(`demo:${key}`),
    redis.get(`demo:${key}:content:index.html`)
  ])
  .then( result => {
    const config_json = result[0]
    const content = result[1]

    if(!config_json)
      return next()

    if(content)
      return res.send(content)

    const config = JSON.parse(config_json)

    if(req.user && (req.user.id == config.user)) {
      return res.render('demo-setup', {
        url: url,
        path: path,
        config: config
      })
    } else {
      res.render('demo-pending', {
        url: url
      })
    }

  })

})


// demo source
app.get('/:key.tar.gz', (req, res, next) => {

  var key = req.params.key

  try {
    slugValidator(key)
  } catch (e) {
    return next()
  }

  const path = '/' + key
  const url = req.get('host') + path

  redis.get(`demo:${key}`)
  .then( config_json => {

    if(!config_json)
      return next()

    const config = JSON.parse(config_json)

    if(req.user && (req.user.id == config.user)) {

      return bundler('./demos/broadcast', {

        DEMO_KEY: key,

        // TODO - these should be per-user
        PUSHER_APP_ID: process.env.PUSHER_APP_ID,
        PUSHER_KEY: process.env.PUSHER_KEY,
        PUSHER_SECRET: process.env.PUSHER_SECRET,
        PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,

      }, res)

    } else {
      next()
    }

  })

})
