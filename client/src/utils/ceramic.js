import { CeramicClient } from '@ceramicnetwork/http-client';
import { IDX } from '@ceramicstudio/idx';
import { DID } from 'dids';
import { getResolver as getKeyResolver } from 'key-did-resolver';
import { getResolver as get3IDResolver } from '@ceramicnetwork/3id-did-resolver';
import { EthereumAuthProvider, ThreeIdConnect } from '@3id/connect';
import { DIDDataStore } from '@glazed/did-datastore';
import modelAliases from '../model/model.json';

const threeID = new ThreeIdConnect();
const CERAMIC_URL = 'http://localhost:7007';

export const connectCeramic = async (provider, address) => {
  try {
    const authProvider = new EthereumAuthProvider(provider, address);
    await threeID.connect(authProvider);
    const ceramic = new CeramicClient(CERAMIC_URL);
    const did = new DID({
      provider: threeID.getDidProvider(),
      resolver: {
        ...get3IDResolver(ceramic),
        ...getKeyResolver(),
      },
    });
    await did.authenticate();
    ceramic.did = did;

    // USING IDX
    const idx = new IDX({ ceramic });
    const basicProfile = await idx.get('basicProfile');
    // USING IDX

    // USING DID Datastore
    // const store = new DIDDataStore({ ceramic, model: modelAliases });
    // const basicProfile = await store.get('basicProfile');
    // console.log(basicProfile);
    // USING DID Datastore

    return {
      ceramicClient: ceramic,
      did: did._id,
      idx,
      basicProfile,
    };
  } catch (e) {
    console.log(e);

    throw new Error('Ceramic connection failed!');
  }
};
