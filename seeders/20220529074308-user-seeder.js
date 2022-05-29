'use strict'
const faker = require('faker')
const bcrypt = require('bcryptjs')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = []

    for (let i = 1; i < 6; i++) {
      const user = {
        account: `user${i}`,
        name: faker.name.firstName(),
        password: await bcrypt.hash('12345678', 10),
        avatar: 'https://i.pravatar.cc/300',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      users.push(user)
    }

    await queryInterface.bulkInsert('Users', users, {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {})
  }
}
