const { dbConnect } = require('../db/db');
const {DataTypes} = require ('sequelize');
const {INTEGER, STRING, BOOLEAN} = DataTypes

const history_user_call = dbConnect.define('history_user_calls', {
  id: {
    primaryKey: true,
    type: INTEGER,
    autoIncrement: true,
    allowNull: false
  },
  dial_status: {
    type: STRING,
    allowNull: false,
  },
  state_client: {
    type: STRING,
    allowNull: false,
  },
  state_agent: {
    type: STRING,
    allowNull: false,
  },
  agent: {
    type: STRING,
    allowNull: false,
  },
  id_agent: {
    type: INTEGER,
    allowNull: false,
  },
  number_client: {
    type: INTEGER,
    allowNull: false,
  },
  historyCallId: {
    type: INTEGER,
    allowNull: true,
  },
  dst_channel: {
    type: STRING,
    allowNull: true,
  },
  status: {
    type: BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  process: {
    type: BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
}, { timestamps: true });

module.exports = {history_user_call}