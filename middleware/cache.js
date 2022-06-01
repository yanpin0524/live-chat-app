const Redis = require('ioredis')
const redis = new Redis()
const helpers = require('../_helpers')

const cache = (req, res, next) => {
  const id = helpers.getUser(req).id
  redis.get(id, (error, result) => {
    if (error) throw new Error('快取層錯誤')
    if (result !== null) {
      return res.json(JSON.parse(result))
    } else {
      return next()
    }
  })
}

module.exports = cache
