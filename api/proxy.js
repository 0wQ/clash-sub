const fetch = require('node-fetch')

module.exports = (req, res) => {
  const { token, url } = req.query

  console.log('token:', token, 'process.env.token:', process.env.token)
  console.log('proxy:', url)

  let allow = []
  if (process.env.token) {
    allow.push(token === process.env.token)
  }
  allow.push(url.endsWith('.yml') || url.endsWith('.yaml') || url.endsWith('.txt') || url.endsWith('override') || url.endsWith('.list') || url.endsWith('.conf') || url.endsWith('module'))

  if (allow.includes(false)) {
    res.status(403).send()
    return
  }

  fetch(url)
    .then(r => r.text())
    .then(d => {
      res.setHeader('content-type', 'text/plain')
      res.setHeader('cache-control', 'public, max-age=60, s-maxage=60')
      res.status(200).send(d)
    })
    .catch(e => {
      console.error(e)
      res.status(403).send()
    })
}
