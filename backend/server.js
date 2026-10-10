'use strict';

const config = require('./config');
const app = require('./app');

app.listen(config.port, () => {
  console.log(`CRM running on http://localhost:${config.port}`);
});
