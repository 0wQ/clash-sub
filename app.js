const express = require('express')
const api = require('./api')
const proxy = require('./api/proxy')

const app = express()

app.get('/api', api)
app.get('/api/proxy', proxy)

console.info('http://localhost:3000/api')
app.listen(3000)
