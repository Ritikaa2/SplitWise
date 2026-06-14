const poolPromise = require("../config/database");

async function getPool() {
  return await poolPromise;
}

module.exports = getPool;