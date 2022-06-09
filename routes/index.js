const express = require('express')
const router = express.Router()
const passport = require('../config/passport')
const userController = require('../controllers/apis/user-controllers')
const { apiErrorHandler } = require('../middleware/error-handler')
const upload = require('../middleware/multer')
const { authenticated } = require('../middleware/api-auth')

router.post(
  '/signin',
  passport.authenticate('local', { session: false, failWithError: true }),
  userController.signIn
)
router.get('/current_user', authenticated, userController.getCurrentUser)

router.put('/user/:id', authenticated, upload.fields([
  { name: 'avatar', maxCount: 1 }
]), userController.editUser)
router.post('/user', userController.signUp)

router.post('/upload', authenticated, userController.uploadImage)

router.use('/', apiErrorHandler)

module.exports = router
