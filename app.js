import express from 'express'
import api from './api/index.js'
import proxy from './api/proxy.js'

const app = express()

app.get('/api', api)
app.get('/proxy', proxy)

console.info('http://localhost:3000/api')
app.listen(3000)
