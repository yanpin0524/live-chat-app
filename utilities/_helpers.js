function getUser (req) {
  return req.user || null
}

const imgur = require('imgur')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
imgur.setClientId(IMGUR_CLIENT_ID)

const fs = require('fs')
const { promisify } = require('util')
const { v4: uuid } = require('uuid')

const imgurFileHandler = file => {
  if (!file) return null
  return new Promise((resolve, reject) => {
    return imgur.uploadFile(file.path)
      .then(img => {
        resolve(img?.link || null)
      })
      .catch(err => reject(err))
  })
}

const saveImage = data => {
  const writeFile = promisify(fs.writeFile)
  return new Promise((resolve, reject) => {
    if (!data) {
      reject(new Error('File not available!'))
    }
    try {
      const fileName = `img_${uuid()}.jpg`

      writeFile(`./src/uploads/original/${fileName}`, data)

      resolve(fileName)
    } catch (error) {}
  })
}

module.exports = {
  getUser,
  imgurFileHandler,
  saveImage
}
