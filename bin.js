#!/usr/bin/env node

const { command, flag } = require('paparam')
const CorestoreSnapshot = require('./')

const args = command('corestore-snapshot',
  flag('--open', 'Open the snapshot, run before'),
  flag('--close', 'Close the snapshot, run after your stage'),
  flag('--snapshot <path>', 'Which snapshot file to use'),
  flag('--storage <path>', 'Which corestore to use')
).parse()

if (args) run()

async function run() {
  const c = new CorestoreSnapshot({
    storage: args.flags.storage,
    snapshot: args.flags.snapshot
  })

  if (args.flags.open) await c.open()
  if (args.flags.close) await c.close()
}
