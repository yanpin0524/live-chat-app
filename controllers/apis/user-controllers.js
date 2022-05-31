const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { User } = require('../../models')
const helpers = require('../../_helpers')
const { Op } = require('sequelize')

const userController = {
  signIn: async (req, res, next) => {
    try {
      const userData = helpers.getUser(req)?.toJSON()
      delete userData.password
      const token = jwt.sign(userData, process.env.JWT_SECRET, {
        expiresIn: '30d'
      })
      req.session.token = token
      res.json({
        status: 'success',
        data: {
          token,
          user: userData
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

      res.json({
        status: 'success',
        data: {
          token,
          user: userData
        }
      })
    } catch (err) {
      next(err)
    }
  },

  getCurrentUser: (req, res, next) => {
    try {
      const userData = helpers.getUser(req)?.toJSON()
      if (!userData) return res.status(500).json({ status: 'error', message: '未存取到登入資料' })

      const { id, account, name, avatar } = userData
      const { token } = req.session

      return res.status(200).json({
        status: 'success',
        data: {
          token,
          id,
          account,
          name,
          avatar
        }
      })
    } catch (err) {
      next(err)
    }
  },

  editUser: async (req, res, next) => {
    try {
      const me = helpers.getUser(req)
      if (!me) return res.status(500).json({ status: 'error', message: '未存取到登入資料' })

      const { files } = req
      const avatar = await helpers.imgurFileHandler(files?.avatar?.[0]) || me.avatar

      if (me.id !== Number(req.params.id)) return res.status(401).json({ status: 'error', message: '你沒有編輯權限' })

      const { account, name } = req.body
      const existedUser = await User.findAll({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: me.id } },
            { account: account }
          ]
        }
      })
      if (existedUser.length) throw new Error('使用者已經存在')

      const user = await User.findByPk(req.params.id)
      if (!user) throw new Error('沒有找到相關的使用者資料')

      const password = await bcrypt.hash(req.body.password, 10) || user.password
      const updatedUser = await user.update({
        account,
        name,
        password,
        avatar
      })
      const data = updatedUser.toJSON()
      delete data.password
      delete data.createdAt
      delete data.updatedAt

      return res.status(200).json({
        status: 'success',
        data
      })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = userController
