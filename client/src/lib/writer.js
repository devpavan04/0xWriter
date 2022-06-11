import { Client, Where, ThreadID } from '@textile/hub';
import { getThreadDBCredentials } from '../utils/threadDB.js';

export const registerUser = async (address, did) => {
  try {
    const credentials = await getThreadDBCredentials();

    if (credentials) {
      const { threadDBClient, threadID } = credentials;

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
    } else {
      throw new Error('ThreadDB credentials not found! Reconnect your wallet.');
    }
  } catch (e) {
    console.log(e);

    throw new Error(e.message);
  }
};

export const getUser = async (did) => {
  try {
    const credentials = await getThreadDBCredentials();

    if (credentials) {
      const { threadDBClient, threadID } = credentials;

      const query = new Where('did').eq(did);

      const user = await threadDBClient.find(threadID, 'Users', query);

      return user[0];
    } else {
      throw new Error('ThreadDB credentials not found! Reconnect your wallet.');
    }
  } catch (e) {
    console.log(e);

    throw new Error(e.message);
  }
};

export const getUsers = async () => {
  try {
    const credentials = await getThreadDBCredentials();

    if (credentials) {
      const { threadDBClient, threadID } = credentials;

      const users = await threadDBClient.find(threadID, 'Users', {});

      return users;
    } else {
      throw new Error('ThreadDB credentials not found! Reconnect your wallet.');
    }
  } catch (e) {
    console.log(e);

    throw new Error(e.message);
  }
};
