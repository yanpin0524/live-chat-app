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
  allowEIO3: true,
  transports: ['websocket', 'polling']
})

const Redis = require('redis')
const redisClient = Redis.createClient()
const DEFAULT_EXPIRATION = 3600

// const Broker = require('./src/services/rabbitMQ')
// const fileUpload = require('express-fileupload')
// const publishToExchange = require('./src/queueWorkers/producer')
// const { v4: uuid } = require('uuid')
// const fs = require('fs')
// const { promisify } = require('util')

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

// app.use(fileUpload())
// const RMQProducer = new Broker().init()

// app.use(async (req, res, next) => {
//   try {
//     req.RMQProducer = await RMQProducer
//     next()
//   } catch (error) {
//     process.exit(1)
//   }
// })

// const saveImage = data => {
//   const writeFile = promisify(fs.writeFile)
//   return new Promise((resolve, reject) => {
//     if (!data) {
//       reject('File not available!')
//     }
//     try {
//       const fileName = `img_${uuid()}.jpg`

//       writeFile(`./src/uploads/original/${fileName}`, data)

//       resolve(fileName)
//     } catch (error) {}
//   })
// }

// // your routes here
// app.post('/upload', async (req, res) => {
//   const { data } = req.files.image
//   try {
//     const message = await saveImage(data)
//     await publishToExchange(req.RMQProducer, {
//       message,
//       routingKey: 'image'
//     })
//     res.status(200).send('File uploaded successfully!')
//   } catch (error) {
//     res.status(400).send('File not uploaded!')
//   }
// })

app.use((req, res, next) => {
  req.io = io
  return next()
})

app.use('/api', router)

const onlineUsers = []

io.on('connection', function (socket) {
  console.log('socket.io 成功連線')

  socket.on('new user', newUser => {
    if (typeof newUser !== 'object') newUser = JSON.parse(newUser)
    if (!onlineUsers.find(userItem => userItem.id === newUser.id)) onlineUsers.push(newUser)
    io.emit('online users', onlineUsers)
  })

  socket.on('user logout', async message => {
    if (typeof message !== 'object') message = JSON.parse(message)

    redisClient.get(`user?id=${message.id}`, async (err, user) => {
      if (err) throw new Error('Error: cache in socket')
      if (user != null) {
        const logoutUser = user
        onlineUsers.forEach((user, index) => {
          if (user.id === message.id) onlineUsers.splice(index, 1)
        })

        io.emit('user leaves', logoutUser)
        io.emit('online users', onlineUsers)
      } else {
        const logoutUser = await User.findByPk(message.id, {
          attributes: ['id', 'account', 'name', 'avatar'],
          raw: true
        })
        onlineUsers.forEach((user, index) => {
          if (user.id === message.id) onlineUsers.splice(index, 1)
        })

        io.emit('user leaves', logoutUser)
        io.emit('online users', onlineUsers)
      }
    })
  })

  socket.on('user send message', async message => {
    if (typeof message !== 'object') message = JSON.parse(message)
    redisClient.get(`user?id=${message.id}`, async (err, user) => {
      if (err) throw new Error('Error: cache in socket')
      if (user != null) {
        const sender = JSON.parse(user)
        io.emit('new message', { message: message.text, sender })
      } else {
        const sender = await User.findByPk(message.id, {
          attributes: ['id', 'account', 'name', 'avatar'],
          raw: true
        })
        redisClient.setex(`user?id=${message.id}`, DEFAULT_EXPIRATION, JSON.stringify(sender))
        io.emit('new message', { message: message.text, sender })
      }
    })
  })
})

server.listen(port, () =>
  console.log(`Example app listening on http://localhost:${port}`)
)

// process.on('SIGINT', async () => {
//   process.exit(1)
// })
// process.on('exit', code => {
//   RMQProducer.channel.close()
//   RMQProducer.connection.close()
// })

module.exports = app
