const { CosmosClient } = require('@azure/cosmos');

let client = null;
let database = null;
let containers = {};

const DB_NAME = 'cadence';
const CONTAINER_DEFS = [
  { id: 'schedules', partitionKey: '/userId' },
  { id: 'push_subscriptions', partitionKey: '/userId' },
];

/**
 * Initialize the Cosmos DB client and ensure the database/containers exist.
 * Safe to call multiple times — uses lazy singleton pattern.
 */
async function getContainer(containerName) {
  if (containers[containerName]) {
    return containers[containerName];
  }

  const connectionString = process.env.COSMOS_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('COSMOS_CONNECTION_STRING is not set');
  }

  if (!client) {
    client = new CosmosClient(connectionString);
  }

  if (!database) {
    const { database: db } = await client.databases.createIfNotExists({
      id: DB_NAME,
    });
    database = db;
  }

  const def = CONTAINER_DEFS.find((d) => d.id === containerName);
  if (!def) {
    throw new Error(`Unknown container: ${containerName}`);
  }

  const { container } = await database.containers.createIfNotExists({
    id: def.id,
    partitionKey: { paths: [def.partitionKey] },
  });

  containers[containerName] = container;
  return container;
}

module.exports = { getContainer };
