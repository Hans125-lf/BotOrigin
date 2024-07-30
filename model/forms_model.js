const { dbConnect } = require('../db/db');
const {DataTypes} = require ('sequelize');
const {INTEGER, STRING, BOOLEAN, NUMBER, DATE} = DataTypes

const forms = dbConnect.define('forms',  {
    id: {
        primaryKey: true,
        type: INTEGER,
        autoIncrement: true,
        allowNull: false
      },
      data: {
        type: STRING,
        allowNull: false
      },
      customFormId: {
        ForeignKey: true,
        type: STRING,
        allowNull: false
      },
      historyCallId: {
        ForeignKey: true,
        type: NUMBER,
        allowNull: false
      },
      formId: {
        ForeignKey: true,
        type: NUMBER,
        allowNull: false
      },
      creatorId: {
        ForeignKey: true,
        type: NUMBER,
        allowNull: false
      },
      process: {
        ForeignKey: true,
        type: BOOLEAN,
        allowNull: false
      },
      updaterId: {
        ForeignKey: true,
        type: DATE,
        allowNull: false
      },
      createdAt: {
        type: DATE,
        allowNull: false
      }
}, { timestamps: true , modelName: "forms", tableName: "forms" });

module.exports = {forms}