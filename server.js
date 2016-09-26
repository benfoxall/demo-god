require('dotenv').config({silent: true})

const express = require('express')
const passport = require('passport')
const Redis = require('ioredis')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)

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
    console.log('FOUND', profile)
    cb(null, profile)
  }
))

app.get('/login', passport.authenticate('google', { scope: ['profile', 'email'] }))

app.get('/callback',
  passport.authenticate('google'),
  (req, res) => res.redirect('/')
)

app.get('/logout', function(req, res){
  req.logout()
  res.redirect('/')
})


app.set('view engine', 'pug')

app.get('/', (req, res) => {
  res.render('index', {user: req.user})
})

app.listen(process.env.PORT || 3000)

app.get('/:key', (req, res) => {

  const url = req.get('host') + '/' + req.params.key

  res.render('demo', {url: url})
})
