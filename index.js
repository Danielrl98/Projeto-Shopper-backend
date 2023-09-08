const express = require('express')
const app = express()


require('dotenv').config()
const router = require('./src/routes')


const protocol = process.env.PROTOCOL || 'http'
const ip = require('ip').address()

app.use(router)

app.listen( 8000, () => console.log(`rodando na porta ${8000}`))