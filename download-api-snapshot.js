const https = require('https')
const fs = require('fs')
const path = require('path')

const file = fs.createWriteStream(
  path.join(process.argv[2], 'data.apisnapshot')
)

https.get(
  'https://raw.githubusercontent.com/dadi/api/develop/test/data.apisnapshot',
  function(response) {
    response.pipe(file)
  }
)
