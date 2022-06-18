import { Web3Storage } from 'web3.storage/dist/bundle.esm.min.js';

const makeStorageClient = () => {
  return new Web3Storage({ token: process.env.REACT_APP_WEB3STORAGE_TOKEN });
};

export const storeFile = async (file) => {
  const client = makeStorageClient();
  const cid = await client.put([file]);
  return cid;
};

export const retrieveFile = async (cid) => {
  const client = makeStorageClient();
  const res = await client.get(cid);
  if (!res.ok) {
    throw new Error(`failed to get ${cid} - [${res.status}] ${res.statusText}`);
  }

  console.log(res);
  // console.log(await res.files());

  // unpack File objects from the response
  // const files = await res.files();
  // for (const file of files) {
  //   console.log(`${file.cid} -- ${file.path} -- ${file.size}`);
  // }

  // return files[0];
};
