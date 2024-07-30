const { dbConnect } = require('../db/db');
const {DataTypes} = require ('sequelize');
const {INTEGER, STRING, DATE} = DataTypes

const counts_calls = dbConnect.define('counts_calls', {
    id: {
        primaryKey: true,
        type: INTEGER,
        autoIncrement: true,
        allowNull: false
    },
    total_answer: {
        type: INTEGER,
        allowNull: true
    },
    answer_inbound: {
        type: INTEGER,
        allowNull: true
    },
    answer_callme: {
        type: INTEGER,
        allowNull: true
    },
    answer_outbound: {
        type: INTEGER,
        allowNull: true
    },
    answer_losses: {
        type: INTEGER,
        allowNull: true
    },
    answer_base: {
        type: INTEGER,
        allowNull: true
    },
    time_online: {
        type: INTEGER,
        allowNull: true
    },
    time_filling_form: {
        type: INTEGER,
        allowNull: true
    },
    time_bath: {
        type: INTEGER,
        allowNull: true
    },
    time_break: {
        type: INTEGER,
        allowNull: true
    },
    time_formatition: {
        type: INTEGER,
        allowNull: true
    },
    time_supervisor: {
        type: INTEGER,
        allowNull: true
    },
    time_call: {
        type: INTEGER,
        allowNull: true
    },
    id_agent: {
        type: INTEGER,
        allowNull: false
    },
    agent: {
        type: STRING,
        allowNull: false
    },
    createdAt: {
        type: DATE,
        allowNull: false
    },
    updatedAt: {
        type: DATE,
        allowNull: false
    }
}, { timestamps: true, modelName: 'counts_calls', tableName: 'counts_calls'});

module.exports = {counts_calls}