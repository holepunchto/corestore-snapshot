# corestore-snapshot

Little thing that snapshots corestore state to disk for stateless reuse

```
npm install corestore-snapshot
```

## Usage

```
# on ci
corestore-snapshot --open --corestore=./store
# ... mutate it
corestore-snapshot --close --corestore=./store
# commit the snapshot file
```

## License

Apache-2.0
