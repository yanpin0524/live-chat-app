if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcryptjs')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const { User, Identity } = require('../models')

passport.use(
  new LocalStrategy(
    {
      usernameField: 'account',
      passwordField: 'password',
      passReqToCallback: true
    },
    async (req, account, password, cb) => {
      try {
        const user = await User.findOne({ where: { account }, include: Identity })
        if (!user) return cb(null, false)
        const res = await bcrypt.compare(password, user.password)
        if (!res) return cb(null, false)
        return cb(null, user)
      } catch (err) {
        cb(err)
      }
    }
  )
)

passport.serializeUser((user, cb) => {
  cb(null, user.id)
})
passport.deserializeUser(async (id, cb) => {
  const user = await User.findByPk(id)
  return cb(null, user)
})

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'SILK'
}

passport.use(
  new JwtStrategy(jwtOptions, async function (jwtPayload, cb) {
    try {
      const user = await User.findByPk(jwtPayload.id)
      cb(null, user)
    } catch (err) {
      cb(err)
    }
  })
)

module.exports = passport
