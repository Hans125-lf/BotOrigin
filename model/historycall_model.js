const { dbConnect } = require('../db/db');
const {DataTypes} = require ('sequelize');
const {INTEGER, STRING, BIGINT, BOOLEAN} = DataTypes

const history_call = dbConnect.define('history_calls', {
  id: {
    primaryKey: true,
    type: INTEGER,
    autoIncrement: true,
    allowNull: false
  },
  firtsCalltype: {
    type: STRING,
    allowNull: true,
  },
  calltype: {
    type: STRING,
    allowNull: false,
  },
  channel: {
    type: STRING,
    allowNull: false,
  },
  billsec: {
    type: BIGINT,
    allowNull: false,
  },
  uniqueid: {
    type: STRING,
    allowNull: false,
    unique: true,
  },
  rec: {
    type: STRING,
    allowNull: false,
  },
  status: {
    type: BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  hangup: {
    type: BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  process: {
    type: BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
}, { timestamps: true });

module.exports = {history_call}