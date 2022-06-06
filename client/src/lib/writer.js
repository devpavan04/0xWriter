const { Client, Where, ThreadID } = require('@textile/hub');

export const registerUser = async (address, did, threadDBClient, threadID) => {
  const userData = {
    address,
    did,
    deployedContractAddress: '',
    subscribedBy: [],
    subscribedTo: [],
  };

  const query = new Where('did').eq(did);

  const user = await threadDBClient.find(threadID, 'Users', query);

  if (user.length < 1) {
    await threadDBClient.create(threadID, 'Users', [userData]);
  }
};

export const getUser = async (did, threadDBClient, threadID) => {
  const query = new Where('did').eq(did);

  const user = await threadDBClient.find(threadID, 'Users', query);

  return user[0];
};

export const getUsers = async (threadDBClient, threadID) => {
  const users = await threadDBClient.find(threadID, 'Users', {});

  return users;
};
