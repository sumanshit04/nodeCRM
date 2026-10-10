'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Client } = require('pg');

async function main() {
  const url = new URL(process.env.DATABASE_URL);
  const client = new Client({
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: Number(url.port || 5432),
    database: 'postgres',
  });
  const dbName = url.pathname.replace(/^\//, '').split('?')[0];
  await client.connect();
  const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (!result.rowCount) {
    await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '')}"`);
    console.log(`Created database ${dbName}`);
  } else {
    console.log(`Database ${dbName} already exists`);
  }
  await client.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
