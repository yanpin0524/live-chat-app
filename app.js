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
const { getUser } = require('./utilities/_helpers')
const corsOptions = require('./config/cors')
const { User } = require('./models')
const getOrSetCache = require('./utilities/cache')
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')

const fileUpload = require('express-fileupload')
const Broker = require('./src/services/rabbitMQ')

const RMQProducer = new Broker().init()

const io = new Server(server, {
  cors: {
    origin: [
      process.env.GITHUB_PAGE,
      'http://localhost:8080'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  allowEIO3: true
})

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

app.use('/api/upload', fileUpload())
app.use(async (req, res, next) => {
  try {
    req.RMQProducer = await RMQProducer
    next()
  } catch (error) {
    process.exit(1)
  }
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

    const logoutUser = await getOrSetCache(`user?id=${message.id}`, async () => {
      const user = await User.findByPk(message.id, {
        attributes: ['id', 'account', 'name', 'avatar'],
        raw: true
      })
      return user
    })

    onlineUsers.forEach((user, index) => {
      if (user.id === message.id) onlineUsers.splice(index, 1)
    })
    io.emit('user_leaves', {
      status: 'logout',
      data: logoutUser
    })
    io.emit('online_users', onlineUsers)
  })

  socket.on('user_send_message', async message => {
    if (typeof message !== 'object') message = JSON.parse(message)

    const sender = await getOrSetCache(`user?id=${message.id}`, async () => {
      const user = await User.findByPk(message.id, {
        attributes: ['id', 'account', 'name', 'avatar'],
        raw: true
      })
      return user
    })

    io.emit('new_message', { message: message.text, createdAt: Date(), sender })
  })
})

server.listen(port, () =>
  console.log(`Example app listening on http://localhost:${port}`)
)

process.on('SIGINT', async () => {
  process.exit(1)
})
process.on('exit', code => {
  RMQProducer.channel.close()
  RMQProducer.connection.close()
})

module.exports = app
