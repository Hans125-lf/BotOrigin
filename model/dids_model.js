const { dbConnect } = require('../db/db');
const {DataTypes} = require ('sequelize');
const {INTEGER, STRING, BOOLEAN} = DataTypes

const did = dbConnect.define('dids', {
    id: {
      primaryKey: true,
      type: INTEGER,
      autoIncrement: true,
      allowNull: false
    },
    did: {
      type: INTEGER,
      allowNull: false
    },
    queue: {
      type: STRING,
      allowNull: false
    },
    identifier: {
      type: STRING,
      allowNull: false
    },
    url: {
      type: STRING,
      allowNull: true
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

  module.exports = {did}