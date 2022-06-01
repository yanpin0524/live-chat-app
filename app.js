if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express')
const port = process.env.PORT || 3000
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, {
  cors: {
<<<<<<< HEAD
    origin: 'http://localhost:8080',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  allowEIO3: true
=======
    origin: 'http://localhost:8080/',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  }
>>>>>>> main
})
const cors = require('cors')
const session = require('express-session')
const SESSION_SECRET = process.env.SESSION_SECRET
const passport = require('./config/passport')
const router = require('./routes')
const { getUser } = require('./_helpers')
const { User } = require('./models')

const Redis = require('redis')
const redisClient = Redis.createClient()
const DEFAULT_EXPIRATION = 3600
const Broker = require('./src/services/rabbitMQ')

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
<<<<<<< HEAD

// const corsOptions = {
//   origin: [
//     process.env.GITHUB_PAGE,
//     'http://localhost:8080'
//   ],
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//   credentials: true,
//   allowedHeaders: ['Content-Type', 'Authorization']
// }

// app.use(cors(corsOptions))
app.use(cors())

// const corsOptions = {
//   origin: '*',
//   credentials: true
// }

// app.use(cors(corsOptions))

app.get('/', function (req, res) {
  res.set('Access-Control-Allow-Origin', '*')
  res.end('hello world')
=======
// const corsOptions = {
//   origin: [
//     process.env.GITHUB_PAGE,
//     'http://localhost:8080'
//   ],
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//   allowedHeaders: ['Content-Type', 'Authorization']
// }
// app.use(cors(corsOptions))

app.use((req, res, next) => {
  req.io = io

  const onlineUsers = []

  io.on('connection', function (socket) {
    console.log('socket.io 成功連線')

    socket.on('user login', async (message) => {
      const nweUser = await User.findByPk(message.id, {
        attributes: ['id', 'account', 'name', 'avatar'],
        raw: true
      })
      if (!onlineUsers.find(user => user.id === nweUser.id)) onlineUsers.push(nweUser)
      io.emit('user joins', nweUser)
      io.emit('online users', onlineUsers)
    })

    socket.on('user logout', async (message) => {
      const logoutUser = await User.findByPk(message.id, {
        attributes: ['id', 'account', 'name', 'avatar'],
        raw: true
      })

      onlineUsers.forEach((user, index) => {
        if (user.id === message.id) onlineUsers.splice(index, 1)
      })

      io.emit('user leaves', logoutUser)
      io.emit('online users', onlineUsers)
    })

    socket.on('user send message', async (message) => {
      const sender = await User.findByPk(message.id, {
        attributes: ['id', 'account', 'name', 'avatar'],
        raw: true
      })

      io.emit('new message', { message: message.text, sender })
    })
  })
  return next()
>>>>>>> main
})

app.use('/api', router)
// app.get('/', (req, res) => res.send('<h1>Hello world !!</h1>'))

<<<<<<< HEAD
const onlineUsers = []

io.on('connection', function (socket) {
  console.log('socket.io 成功連線')

  socket.on('user login', async message => {
    const nweUser = await User.findByPk(message.id, {
      attributes: ['id', 'account', 'name', 'avatar'],
      raw: true
    })
    if (!onlineUsers.find(user => user.id === nweUser.id)) onlineUsers.push(nweUser)
    io.emit('user joins', nweUser)
    io.emit('online users', onlineUsers)
  })

  socket.on('user logout', async message => {
    const logoutUser = await User.findByPk(message.id, {
      attributes: ['id', 'account', 'name', 'avatar'],
      raw: true
    })

    onlineUsers.forEach((user, index) => {
      if (user.id === message.id) onlineUsers.splice(index, 1)
    })

    io.emit('user leaves', logoutUser)
    io.emit('online users', onlineUsers)
  })

  socket.on('user send message', async message => {
    redisClient.get(`sender?id=${message.id}`, async (err, sender) => {
      if (err) throw new Error('Error: cache in socket')

      if (sender != null) {
        console.log('Cache Hit!!') // ===== test code
        io.emit('new message', { message: message.text, sender })
      } else {
        console.log('Cache Miss!!') // ===== test code
        const sender = await User.findByPk(message.id, {
          attributes: ['id', 'account', 'name', 'avatar'],
          raw: true
        })
        console.log('===== message =====:', message) // ===== test code
        redisClient.setex(`sender?id=${message.id}`, DEFAULT_EXPIRATION, JSON.stringify(sender))
        io.emit('new message', { message: message.text, sender })
      }
    })
  })
})

=======
>>>>>>> main
server.listen(port, () =>
  console.log(`Example app listening on http://localhost:${port}`)
)

module.exports = app
