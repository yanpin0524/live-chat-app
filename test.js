if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express')
const Broker = require('./src/services/rabbitMQ')

const app = express()

console.log('===== outside app.use test =====', process.env.RABBITMQ_URL)
const RMQProducer = new Broker().init()
// app.use(async (req, res, next) => {
//   try {
//     console.log('===== inside app.use test =====', process.env.RABBITMQ_URL)
//     const RMQProducer = await new Broker().init()
//     // we now have access to rabbitMQ
//     next()
//   } catch (error) {
//     process.exit(1)
//   }
// })
// app.use((req, res, next) => {
//   next(creatError.NotFound())
// })

app.listen(process.env.PORT || 3000, () => {
  console.log('server is running', process.env.PORT || 3000)
})
