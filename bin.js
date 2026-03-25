#!/usr/bin/env node

const { command, flag } = require('paparam')
const CorestoreSnapshot = require('./')

const args = command('corestore-snapshot',
  flag('--open', 'Open the snapshot, run before'),
  flag('--close', 'Close the snapshot, run after your stage'),
  flag('--snapshot <path>', 'Which snapshot file to use'),
  flag('--corestore <path>', 'Which corestore to use')
).parse()

if (args) run()

async function run() {
  const c = new CorestoreSnapshot({
    corestore: args.flags.corestore,
    snapshot: args.flags.snapshot
  })

  if (c.open) await c.open()
  if (c.close) await c.close()
}
