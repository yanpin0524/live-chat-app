if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express')
const port = process.env.PORT || 3000
const app = express()
const cors = require('cors')
const session = require('express-session')
const SESSION_SECRET = process.env.SESSION_SECRET
const passport = require('./config/passport')
const router = require('./routes')
const { getUser } = require('./_helpers')
const { User } = require('./models')

const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:8080',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  allowEIO3: true
})

const Redis = require('redis')
const redisClient = Redis.createClient()
const DEFAULT_EXPIRATION = 3600

const corsOptions = {
  origin: [
    process.env.GITHUB_PAGE,
    'http://localhost:8080'
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(
  session({ secret: SESSION_SECRET, resave: false, saveUninitialized: false })
)
app.use(passport.initialize())
app.use(passport.session())

app.use((req, res, next) => {
  res.locals.user = getUser(req)
  next()
})

app.use((req, res, next) => {
  req.io = io
  return next()
})

app.use('/api', router)

const onlineUsers = []

io.on('connection', function (socket) {
  console.log('socket.io 成功連線')

  socket.on('user_login', newUser => {
    if (typeof newUser !== 'object') newUser = JSON.parse(newUser)
    if (!onlineUsers.find(userItem => userItem.id === newUser.id)) onlineUsers.push(newUser)

    io.emit('user_joins', {
      status: 'login',
      data: newUser
    })
    io.emit('online_users', onlineUsers)
  })

  socket.on('user_logout', async message => {
    if (typeof message !== 'object') message = JSON.parse(message)

    redisClient.get(`user?id=${message.id}`, async (err, user) => {
      if (err) throw new Error('Error: cache in socket')
      if (user != null) {
        const logoutUser = JSON.parse(user)
        onlineUsers.forEach((user, index) => {
          if (user.id === message.id) onlineUsers.splice(index, 1)
        })
        io.emit('user_leaves', {
          status: 'logout',
          data: logoutUser
        })
        io.emit('online_users', onlineUsers)
      } else {
        const logoutUser = await User.findByPk(message.id, {
          attributes: ['id', 'account', 'name', 'avatar'],
          raw: true
        })
        onlineUsers.forEach((user, index) => {
          if (user.id === message.id) onlineUsers.splice(index, 1)
        })
        io.emit('user_leaves', {
          status: 'logout',
          data: logoutUser
        })
        io.emit('online_users', onlineUsers)
      }
    })
  })

  socket.on('user_send_message', async message => {
    if (typeof message !== 'object') message = JSON.parse(message)

    redisClient.get(`user?id=${message.id}`, async (err, user) => {
      if (err) io.emit('error_message', { status: 'Redis error', message })
      if (user != null) {
        const sender = JSON.parse(user)
        io.emit('new_message', { message: message.text, createdAt: Date(), sender, query: 'redis' })
      } else {
        const sender = await User.findByPk(message.id, {
          attributes: ['id', 'account', 'name', 'avatar'],
          raw: true
        })
        redisClient.setex(`user?id=${message.id}`, DEFAULT_EXPIRATION, JSON.stringify(sender))
        io.emit('new_message', { message: message.text, createdAt: Date(), sender, query: 'db' })
      }
    })
  })
})

server.listen(port, () =>
  console.log(`Example app listening on http://localhost:${port}`)
)

module.exports = app
