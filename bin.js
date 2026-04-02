#!/usr/bin/env node

const { command, flag } = require('paparam')
const CorestoreSnapshot = require('./')
const ID = require('hypercore-id-encoding')

const args = command('corestore-snapshot',
  flag('--open', 'Open the snapshot, run before'),
  flag('--close', 'Close the snapshot, run after your stage'),
  flag('--snapshot <path>', 'Which snapshot file to use'),
  flag('--storage <path>', 'Which corestore to use'),
  flag('--primary-key <key>', 'Which primary key for the corestore to use')
).parse()

if (args) run()

async function run() {
  let primaryKey = args.flags.primaryKey
  if (primaryKey) primaryKey = ID.decode(primaryKey)

  const c = new CorestoreSnapshot({
    primaryKey,
    storage: args.flags.storage,
    snapshot: args.flags.snapshot
  })

  if (args.flags.open) await c.open({ log: true })
  if (args.flags.close) await c.close({ log: true })
}
