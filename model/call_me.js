const { dbConnect } = require('../db/db');
const {DataTypes} = require ('sequelize');
const {INTEGER, STRING, BOOLEAN} = DataTypes

const call_me = dbConnect.define('call_me', {
    id: {
      primaryKey: true,
      type: INTEGER,
      autoIncrement: true,
      allowNull: false
    },
    number: {
      type: STRING,
      allowNull: false
    },
    inserts: {
      type: INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    attempts: {
      type: INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    state_client: {
      type: STRING,
      allowNull: true
    },
    state_agent: {
      type: STRING,
      allowNull: true
    },
    connected_call: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    on_call: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    didId: {
      type: INTEGER,
      allowNull: false,
    },
    firtsCalltype: {
      type: STRING,
      allowNull: true
    },
    mailbox: {
      type: INTEGER,
      allowNull: true,
    },
    web: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    file: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    manual: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    documentId: {
      type: INTEGER,
      allowNull: true,
    },
    creatorId: {
      type: INTEGER,
      allowNull: true,
    },
    url: {
      type: STRING,
      allowNull: true
    },
    status: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: true,
    }
  }, { timestamps: true , modelName: "call_me", tableName: "call_me" });
  
  module.exports = {call_me}