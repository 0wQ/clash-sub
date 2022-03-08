const { parse, stringify } = require('yaml')
const { orderBy, uniqBy } = require('lodash')
const fetch = require('node-fetch')

module.exports = async (req, res) => {
  const {
    config_base = process.env.config_base,
    config_nodes = process.env.config_nodes,
    token,
    exclude = '',
    sort = true,
    yaml_merge = process.env.yaml_merge || true,
    userinfo = false,
  } = req.query

  console.log('token:', token, 'process.env.token:', process.env.token)
  console.log('config_base:', config_base)
  console.log('config_nodes:', config_nodes)

  let allow = []
  if (process.env.token) {
    allow.push(token === process.env.token)
  }
  allow.push(isUrl(config_base))
  allow.push(isUrl(config_nodes))

  if (allow.includes(false)) {
    res.status(403).send()
    return
  }

  const toBoolean = s => (s === 'true' || s === true || s === '1' || s === 1)
  const is_sort = toBoolean(sort)
  const is_yaml_merge = toBoolean(yaml_merge)
  const is_show_userinfo = toBoolean(userinfo)

  const node_list_file_res = await fetch(config_nodes)
  const node_list_file_headers = node_list_file_res.headers
  const node_list_file = await node_list_file_res.text()

  const clash_base_file = await (await fetch(config_base)).text()

  const node_list = parse(node_list_file, { merge: is_yaml_merge })
  const node_list_proxies = nodeListHandle(node_list, exclude, is_sort)

  const clash_base = parse(clash_base_file, { merge: yaml_merge })
  const clash_config = configHandle(clash_base, node_list_proxies)
  const clash_config_yaml = stringify(clash_config, { sortMapEntries: false })

  res.setHeader('content-type', 'text/yaml')
  res.setHeader('profile-update-interval', 3)
  res.setHeader('content-disposition', 'inline; filename="My Clash Sub"')
  is_show_userinfo && res.setHeader('subscription-userinfo', node_list_file_headers.get('subscription-userinfo') || 'upload=0; download=5497558138880; total=10995116277760')
  res.send(clash_config_yaml)
}

function configHandle(clash, node_list_proxies) {
  const node_names = node_list_proxies.map(i => i.name)
  console.log(node_names)

  for (const item of clash['proxy-groups']) {
    if (!item.proxies) {
      continue
    }
    const proxies_old = []
    const proxies_new = []
    for (const node_name of item.proxies) {
      const match = node_name.match(/^\/(.+)\/(i)?$/i)
      if (!match) {
        proxies_old.push(node_name)
        continue
      }
      node_names.forEach(node_name => {
        new RegExp(match[1], match[2]).test(node_name) && proxies_new.push(node_name)
      })
    }
    item.proxies = [...proxies_old, ...proxies_new]
  }
  clash.proxies = node_list_proxies
  return clash
}

function nodeListHandle(node_list, exclude_query, sort) {
  const { proxies, exclude = '' } = node_list
  let proxies_out = uniqBy(proxies)
  if (sort) {
    proxies_out = orderBy(proxies_out, ['name'], ['asc'])
  }

  const proxiesFilter = (p, arg1, arg2) => {
    if (!arg1) return
    let re
    try {
      re = new RegExp(arg1, arg2)
    } catch (e) {
      console.error(e)
    }
    if (re) {
      proxies_out = p.filter(i => !re.test(i.name))
    }
  }

  if (exclude) {
    const match = exclude.match(/^\/(.+)\/(i)?$/i)
    proxiesFilter(proxies_out, match[1], match[2])
  }
  if (exclude_query) {
    proxiesFilter(proxies_out, exclude_query)
  }

  proxies_out.map(i => i.name = i.name.replace(/^\[.*?\]/, ''))

  return proxies_out
}

function isUrl(string) {
  let url
  try {
    url = new URL(string)
  } catch (_) {
    return false
  }
  return url.protocol === 'http:' || url.protocol === 'https:'
}
