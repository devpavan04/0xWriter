import { Where } from '@textile/hub';
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

export const getUserByDID = async (did) => {
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

export const getUserByAddress = async (address) => {
  try {
    const credentials = await getThreadDBCredentials();

    if (credentials) {
      const { threadDBClient, threadID } = credentials;

      const query = new Where('address').eq(address);

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

export const setUserDeployedContractAddress = async (did, deployedContractAddress) => {
  try {
    const credentials = await getThreadDBCredentials();

    if (credentials) {
      const { threadDBClient, threadID } = credentials;

      const query = new Where('did').eq(did);

      const user = await threadDBClient.find(threadID, 'Users', query);

      if (user.length < 1) return;

      let userData = user[0];

      if (userData.deployedContractAddress === deployedContractAddress) return;

      userData.deployedContractAddress = deployedContractAddress;

      return await threadDBClient.save(threadID, 'Users', [userData]);
    } else {
      throw new Error('ThreadDB credentials not found! Reconnect your wallet.');
    }
  } catch (e) {
    console.log(e);

    throw new Error(e.message);
  }
};

export const addSubscriber = async (did, subscriberDID) => {
  try {
    if (did === subscriberDID) return;

    const credentials = await getThreadDBCredentials();

    if (credentials) {
      const { threadDBClient, threadID } = credentials;

      const writerQuery = new Where('did').eq(did);
      const writer = await threadDBClient.find(threadID, 'Users', writerQuery);
      if (writer.length < 1) return;
      let writerData = writer[0];
      if (writerData.subscribedBy.includes(subscriberDID) === true) return;
      writerData.subscribedBy.push(subscriberDID);
      await threadDBClient.save(threadID, 'Users', [writerData]);

      const subscriberQuery = new Where('did').eq(subscriberDID);
      const subscriber = await threadDBClient.find(threadID, 'Users', subscriberQuery);
      if (subscriber.length < 1) return;
      let subscriberData = subscriber[0];
      if (subscriberData.subscribedTo.includes(did) === true) return;
      subscriberData.subscribedTo.push(did);
      return await threadDBClient.save(threadID, 'Users', [subscriberData]);
    } else {
      throw new Error('ThreadDB credentials not found! Reconnect your wallet.');
    }
  } catch (e) {
    console.log(e);

    throw new Error(e.message);
  }
};

export const removeSubscriber = async (did, subscriberDID) => {
  try {
    const credentials = await getThreadDBCredentials();

    if (credentials) {
      const { threadDBClient, threadID } = credentials;

      const writerQuery = new Where('did').eq(did);
      const writer = await threadDBClient.find(threadID, 'Users', writerQuery);
      if (writer.length < 1) return;
      let writerData = writer[0];
      if (writerData.subscribedBy.includes(subscriberDID) === false) return;
      writerData.subscribedBy = writerData.subscribedBy.filter((did) => did !== subscriberDID);
      await threadDBClient.save(threadID, 'Users', [writerData]);

      const subscriberQuery = new Where('did').eq(subscriberDID);
      const subscriber = await threadDBClient.find(threadID, 'Users', subscriberQuery);
      if (subscriber.length < 1) return;
      let subscriberData = subscriber[0];
      if (subscriberData.subscribedTo.includes(did) === false) return;
      subscriberData.subscribedTo = subscriberData.subscribedTo.filter((writerDID) => writerDID !== did);
      return await threadDBClient.save(threadID, 'Users', [subscriberData]);
    } else {
      throw new Error('ThreadDB credentials not found! Reconnect your wallet.');
    }
  } catch (e) {
    console.log(e);

    throw new Error(e.message);
  }
};
