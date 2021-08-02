const fetch = require('node-fetch')

exports.proxy = (req, res) => {
  const { token, url } = req.query
  if (process.env.token && token === process.env.token) {
    res.status(403).end()
  }
  if (!(url.endsWith('.yml') || url.endsWith('.yaml')) && /[?&=]/.test(url)) {
    res.status(404).end()
    return
  }
  console.log('Proxy:', url)
  fetch(url)
    .then(r => r.text())
    .then(d => {
      res.setHeader('cache-control', 'public, max-age=60, s-maxage=60')
      res.status(200).type('yaml').send(d)
    })
    .catch(e => {
      console.error(e)
      res.status(403).end()
    })
}