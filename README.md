# Test tools

## API data script

Tests a snapshot of database operations against an API data connector, using Mocha.

### Usage

```js
const { apiDataScript } = require('@dadi/test-tools')
const MyDataConnector = require('/path/to/your/data-connector')

describe.only(
  'Data script',
  apiDataScript({
    // The constructor for the data connector being tested.
    Connector: MyDataConnector,

    // The contents of the data script.
    script: fs.readFileSync('/path/to/your/data-snapshot', 'utf8'),

    // The interval (in milliseconds) between each test. Defaults to 5.
    testDelay: 5
  })
)
```

To pull the latest snapshot from the API repo, run:

```
npm run download-api-snapshot -- /target/directory
```

This will download `data.apisnapshot` and save it on `/target/directory`.
