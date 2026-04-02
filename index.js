const Corestore = require('corestore')
const Hyperswarm = require('hyperswarm')
const path = require('path')
const fs = require('fs')

module.exports = class CorestoreSnapshotter {
  constructor({
    primaryKey = null,
    storage = './corestore',
    snapshot = './snapshot.json'
  } = {}) {
    this.primaryKey = primaryKey
    this.storage = storage
    this.snapshot = snapshot
  }

  async open({ log = false } = {}) {
    await fs.promises.mkdir(path.dirname(this.snapshot), { recursive: true })
    const json = await parseJSON(this.snapshot)

    if (log) console.log('Opening snapshot', json)

    const store = new Corestore(this.storage, { primaryKey: this.primaryKey, unsafe: true })
    const swarm = new Hyperswarm()

    swarm.on('connection', c => store.replicate(c))

    for (const { key, namespace, name } of json) {
      if (namespace) {
        const ns = store.session({ namespace: Buffer.from(namespace, 'hex') })
        const core = ns.get({ name })
        await core.ready()
        await core.close()
        await ns.close()
      } else {
        const core = store.get(key)
        await core.ready()
        await core.close()
      }
    }

    for await (const discoveryKey of store.list()) {
      swarm.join(discoveryKey, { client: true, server: false })
    }

    for (const { key, length } of json) {
      const core = store.get(key)
      await core.ready()

      if (log) console.log('Waiting for', key, 'at', length)
      while (core.length < length) {
        await new Promise(resolve => setTimeout(resolve, 20))
      }

      await core.close()
    }


    await swarm.destroy()
    await store.close()
  }

  async close({ log = false } = {}) {
    const store = new Corestore(this.storage, { primaryKey: this.primaryKey, unsafe: true })
    const swarm = new Hyperswarm()

    swarm.on('connection', c => store.replicate(c))

    await fs.promises.mkdir(path.dirname(this.snapshot), { recursive: true })

    const json = []
    const all = new Map()

    for await (const discoveryKey of store.list()) {
      swarm.join(discoveryKey, { client: true, server: false })
    }

    for await (const discoveryKey of store.list()) {
      const core = store.get({ discoveryKey })
      await core.ready()

      if (log) console.log('Waiting for', core.id, 'at', core.length)
      while (core.remoteContiguousLength < core.length) {
        await new Promise(resolve => setTimeout(resolve, 20))
      }

      const entry = {
        key: core.id,
        length: core.length,
        namespace: null,
        name: null
      }

      all.set(discoveryKey.toString('hex'), entry)
      json.push(entry)

      await core.close()
    }

    for await (const { discoveryKey, alias } of store.storage.createAliasStream()) {
      const entry = all.get(discoveryKey.toString('hex'))
      if (entry) {
        entry.namespace = alias.namespace.toString('hex')
        entry.name = alias.name
      }
    }

    await fs.promises.writeFile(this.snapshot, JSON.stringify(json, null, 2) + '\n')

    await swarm.destroy()
    await store.close()
  }
}

async function parseJSON(filename) {
  try {
    return JSON.parse(await fs.promises.readFile(filename, 'utf-8'))
  } catch {
    return []
  }
}
