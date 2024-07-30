const { dbConnect } = require('../db/db');
const {DataTypes} = require ('sequelize');
const {INTEGER, STRING, BOOLEAN} = DataTypes

const user = dbConnect.define('users', {
    id: {
      primaryKey: true,
      type: INTEGER,
      autoIncrement: true,
      allowNull: false
    },
    email: {
      type: STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: STRING,
      allowNull: false,
    },
    name: {
      type: STRING,
      allowNull: false,
    },
    lastName: {
      type: STRING,
      allowNull: false,
    },
    roleId: {
      type: INTEGER,
      allowNull: false,
    },
    campId: {
      type: INTEGER,
      allowNull: true
    },
    idAuth: { 
      type: INTEGER,
      allowNull: true,
    },
    creatorId: {
      type: INTEGER,
      allowNull: false,
    },
    updaterId: {
      type: INTEGER,
      allowNull: true,
    },
    status: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: true,
    }
  }, { timestamps: true });

  module.exports = {user}