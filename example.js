const CorestoreSnapshot = require('./')

main()

async function main () {
  const cs = new CorestoreSnapshot()
  await cs.inflate()
  await cs.flush()
}


