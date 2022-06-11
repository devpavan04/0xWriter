import { Client, ThreadID } from '@textile/hub';
import { solveChallenge } from './socket-io';
import { getIdentity } from './identity';

export const connectThreadDB = async (signer, address) => {
  try {
    const credentials = await getThreadDBCredentials();

    if (credentials) {
      const { threadDBClient, threadID } = credentials;

      return { threadDBClient, threadID };
    } else {
      const identity = await getIdentity(signer, address);

      if (!identity) {
        throw Error('User identity is missing!');
      }

      const credentials = await solveChallenge(identity);
      localStorage.setItem('payload', JSON.stringify(credentials));
      const client = await Client.withUserAuth(credentials.userAuth);
      const threadID = Uint8Array.from(credentials.threadID);

      return {
        threadDBClient: client,
        threadID: ThreadID.fromBytes(threadID),
      };
    }
  } catch (e) {
    console.log(e);

    throw new Error(e.message);
  }
};

export const getThreadDBCredentials = async () => {
  const credentials = JSON.parse(localStorage.getItem('payload'));

  if (credentials !== null) {
    const expiration = new Date(credentials.userAuthExpiration).getTime();

    if (expiration > Date.now()) {
      const client = Client.withUserAuth(credentials.userAuth);

      const threadID = Uint8Array.from(credentials.threadID);

      return {
        threadDBClient: client,
        threadID: ThreadID.fromBytes(threadID),
      };
    } else {
      throw new Error('Textile Auth Expired!');
    }
  } else {
    return false;
  }
};
