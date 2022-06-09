const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { User } = require('../../models')
const helpers = require('../../utilities/_helpers')
const { Op } = require('sequelize')
const publishToExchange = require('../../src/queueWorkers/producer')
const Redis = require('redis')
const redisClient = Redis.createClient()
const DEFAULT_EXPIRATION = 3600

const userController = {
  signIn: async (req, res, next) => {
    try {
      const userData = helpers.getUser(req)?.toJSON()
      delete userData.password
      const token = jwt.sign(userData, process.env.JWT_SECRET, {
        expiresIn: '30d'
      })
      req.session.token = token

      const { id, account, name, avatar, createdAt, updatedAt } = userData
      redisClient.setex(`user?id=${id}`, DEFAULT_EXPIRATION, JSON.stringify({ id, account, name, avatar }))

      res.json({
        status: 'success',
        data: {
          token,
          id,
          account,
          name,
          avatar,
          createdAt,
          updatedAt
        }
      })
    } catch (err) {
      if (req.xhr) { return res.json(err) }
      next(err)
    }
  },

  signUp: async (req, res, next) => {
    try {
      const existedUser = await User.findAll({
        where: {
          [Op.or]: [{ account: req.body.account }, { name: req.body.name }]
        }
      })
      if (existedUser.length) {
        return res.status(409).json({
          status: 'error',
          message: '此帳號或名字已經存在'
        })
      }

      const password = await bcrypt.hash(req.body.password, 10)
      const registeredUser = await User.create({
        account: req.body.account,
        name: req.body.name,
        password
      })

      const token = jwt.sign(registeredUser.toJSON(), process.env.JWT_SECRET, {
        expiresIn: '30d'
      })
      let userData = await User.findByPk(registeredUser.id, {
        attributes: { exclude: ['password'] }
      })
      userData = userData.toJSON()
      const { id, account, name, avatar, createdAt, updatedAt } = userData
      redisClient.setex(`user?id=${id}`, DEFAULT_EXPIRATION, JSON.stringify({ id, account, name, avatar }))

      res.json({
        status: 'success',
        data: {
          token,
          id,
          account,
          name,
          avatar,
          createdAt,
          updatedAt
        }
      })
    } catch (err) {
      next(err)
    }
  },

  getCurrentUser: async (req, res, next) => {
    try {
      const id = helpers.getUser(req)?.toJSON().id
      const { token } = req.session
      redisClient.get(`user?id=${id}`, (err, user) => {
        if (err) next()

        if (user != null) {
          user = JSON.parse(user)
          return res.json({
            status: 'success',
            token,
            ...user
          })
        } else {
          const userData = helpers.getUser(req)?.toJSON()
          if (!userData) return res.status(500).json({ status: 'error', message: '未存取到登入資料' })

          const { id, account, name, avatar } = userData
          const response = {
            status: 'success',
            token,
            id,
            account,
            name,
            avatar
          }

          redisClient.setex(`user?id=${id}`, DEFAULT_EXPIRATION, JSON.stringify(response))
          return res.status(200).json(response)
        }
      })
    } catch (err) {
      next(err)
    }
  },

  editUser: async (req, res, next) => {
    try {
      const me = helpers.getUser(req)
      if (!me) return res.status(510).json({ status: 'error', message: '未存取到登入資料' })
      if (me.id !== Number(req.params.id)) return res.status(510).json({ status: 'error', message: '你沒有編輯權限' })
      const { files } = req
      const avatar = await helpers.imgurFileHandler(files?.avatar?.[0]) || me.avatar

      const { account, name } = req.body
      const existedUser = await User.findAll({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: me.id } },
            { account: account }
          ]
        }
      })
      if (existedUser.length) return res.status(510).json({ status: 'error', message: '使用者已經存在' })

      const user = await User.findByPk(req.params.id)
      if (!user) throw new Error('沒有找到相關的使用者資料')

      const password = await bcrypt.hash(req.body.password, 10)
      let updatedUser = await user.update({
        name,
        account,
        avatar,
        password
      })

      updatedUser = JSON.parse(JSON.stringify(updatedUser))
      delete updatedUser.password

      redisClient.setex(`user?id=${updatedUser.id}`, DEFAULT_EXPIRATION, JSON.stringify({
        id: updatedUser.id,
        account: updatedUser.account,
        name: updatedUser.name,
        avatar: updatedUser.avatar
      }))

      return res.status(200).json({
        status: 'success',
        data: {
          ...updatedUser
        }
      })
    } catch (err) {
      next(err)
    }
  },

  uploadImage: async (req, res) => {
    const { data } = req.files.image
    try {
      const message = await helpers.saveImage(data)
      await publishToExchange(req.RMQProducer, {
        message,
        routingKey: 'image'
      })
      res.status(200).json({
        status: 'success',
        message: 'File uploaded successfully!'
      })
    } catch (error) {
      res.status(400).json({
        status: 'error',
        message: 'File not uploaded!'
      })
    }
  }
}

module.exports = userController
