const Sequelize = require('sequelize')

const db = process.env.DATABASE || 'shopper'
const username = process.env.USER|| 'root'
const pass = process.env.PASSWORD || ''
const hostdata = process.env.HOST || 'localhost'
const dialectdb = process.env.DIALECT || 'mysql'

const connection = new Sequelize(db,username,pass,{
    hostdata,
    dialect: dialectdb
})

module.exports=connection