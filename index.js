const Corestore = require('corestore')
const Hyperswarm = require('hyperswarm')
const HypercoreId = require('hypercore-id-encoding')
const path = require('path')
const fs = require('fs')

module.exports = class CorestoreSnapshotter {
  constructor({
    corestore = './store',
    snapshot = './corestore.json'
  } = {}) {
    this.corestore = corestore
    this.snapshot = snapshot
  }

  async inflate() {
    const store = new Corestore(this.corestore)
    const swarm = new Hyperswarm()

    swarm.on('connection', c => store.replicate(c))

    for await (const discoveryKey of store.list()) {
      swarm.join(discoveryKey, { client: true, server: false })
    }

    await fs.promises.mkdir(path.dirname(this.snapshot), { recursive: true })

    const json = await parseJSON(this.snapshot)

    for (const { key, length } of json) {
      const core = store.get(key)
      await core.ready()

      while (core.length < length) {
        await new Promise(resolve => setTimeout(20, resolve))
      }

      await core.close()
    }

    await swarm.destroy()
    await store.close()
  }

  async flush() {
    const store = new Corestore(this.corestore)
    const swarm = new Hyperswarm()

    swarm.on('connection', c => store.replicate(c))

    await fs.promises.mkdir(path.dirname(this.snapshot), { recursive: true })

    const json = []

    for await (const discoveryKey of store.list()) {
      swarm.join(discoveryKey, { client: true, server: false })
    }

    for await (const discoveryKey of store.list()) {
      const core = store.get({ discoveryKey })
      await core.ready()

      while (core.remoteContiguousLength < core.length) {
        await new Promise(resolve => setTimeout(resolve, 20))
      }

      json.push({
        key: core.id,
        length: core.length
      })

      await core.close()
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
