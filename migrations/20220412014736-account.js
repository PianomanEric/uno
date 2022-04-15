'use strict';

const { allow } = require("joi");

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return await queryInterface.createTable("Account", {
      
      account_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      }, 

      username: {
        type: Sequelize.STRING,
        allowNull: false, 
        unique: true
      }, 

      password: {
        type: Sequelize.STRING, 
        allowNull: false
      }

     });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.dropTable('Account'); 
  }
};
