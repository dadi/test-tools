# Test tools

## API data script

Tests a script of database operations against an API data connector, using Mocha.

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
    script: fs.readFileSync('/path/to/your/data-script', 'utf8'),

    // The interval (in milliseconds) between each test. Defaults to 5.
    testDelay: 5
  })
)
```
