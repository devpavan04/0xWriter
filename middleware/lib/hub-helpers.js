const { createAPISig, Client, createUserAuth, PrivateKey } = require('@textile/hub');
const fs = require('fs');
const userSchema = require('../model/schemas/user.json');

const initializeNewThreadDb = async () => {
  const userAuth = await createUserAuth(process.env.USER_GROUP_KEY, process.env.USER_GROUP_SECRET);
  const privateKey = await PrivateKey.fromRandom();
  const client = await Client.withUserAuth(userAuth);
  await client.getToken(privateKey);
  const threadID = await client.newDB();
  await client.newCollection(threadID, { name: 'Users', schema: userSchema });

  return threadID.buf;
};

const getThreadID = async () => {
  const fileData = await fs.readFileSync('threadID.json');
  const thread = JSON.parse(fileData);

  return thread.threadID;
};

const newThreadDBClient = async () => {
  const client = await Client.withKeyInfo({
    key: process.env.USER_GROUP_KEY,
    secret: process.env.USER_GROUP_SECRET,
  });

  return client;
};

const getAPISignature = async () => {
  const expiration = new Date(Date.now() + 7200 * 1000); // 2 hours
  const { sig, msg } = await createAPISig(process.env.USER_GROUP_SECRET, expiration);

  return { sig, msg, expiration };
};

module.exports = {
  initializeNewThreadDb,
  getThreadID,
  newThreadDBClient,
  getAPISignature,
};
