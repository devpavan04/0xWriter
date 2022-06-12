import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Identicon from 'react-identicons';
import contractABI from '../../contracts/abi.json';
import './dashboard.css';
import { Button, Spinner, Spacer, Table, Link, Description, Loading } from '@geist-ui/core';

export const Dashboard = ({ wallet, writer }) => {
  const [owner, setOwner] = useState('');
  const [contractBalance, setContractBalance] = useState('');
  const [deploymentFee, setDeploymentFee] = useState('');
  const [writers, setWriters] = useState([]);

  useEffect(() => {
    async function init() {
      if (writer !== undefined) {
        const owner = await writer.owner();
        setOwner(owner);
        const contractBalance = await writer.getContractBalance();
        setContractBalance(ethers.utils.formatEther(contractBalance));
        const deploymentFee = await writer.getDeploymentFee();
        setDeploymentFee(ethers.utils.formatEther(deploymentFee));

        let writers = await writer.getWriters();
        writers = await Promise.all(
          writers.map(async (writer) => {
            const writerERC20 = new ethers.Contract(
              writer.writerDeployedContractAddress,
              contractABI.writerERC20,
              wallet.injectedProvider
            );
            return Object.assign({}, writer, {
              tokenName: await writerERC20.name(),
              tokenSymbol: await writerERC20.symbol(),
              tokenPrice: ethers.utils.formatEther(await writerERC20.getTokenPrice()) + ' MATIC',
            });
          })
        );
        setWriters(writers);
      }
    }
    init();
  }, [writer]);

  const renderAddress = (value) => {
    return (
      <div className='writers-address-identicon'>
        <Identicon string={value} size='20' />
        {value.substr(0, 10) + '....' + value.slice(value.length - 8)}
      </div>
    );
  };

  const renderDID = (value) => {
    return <>{value.substr(0, 10) + '....' + value.slice(value.length - 8)}</>;
  };

  const renderContractAddress = (value) => {
    return (
      <Link href={`https://mumbai.polygonscan.com/address/${value}`} target={'_blank'} icon>
        Polygonscan
      </Link>
    );
  };

  return (
    <div className='dashboard-content'>
      <>
        <div className='address-identicon'>
          {!owner ? <Spinner /> : <Identicon string={owner} size='40' />}
          <Spacer />
          <Description
            title='Owner'
            content={!owner ? <Spinner /> : owner.substr(0, 12) + '....' + owner.slice(owner.length - 12)}
          />
        </div>
        <Description title='Balance' content={!contractBalance ? <Spinner /> : contractBalance + ' MATIC'} />
        <Description title='Deployment Fee' content={!deploymentFee ? <Spinner /> : deploymentFee + ' MATIC'} />
        <Description
          title='Writers'
          content={
            writers.length < 1 ? (
              <Spinner />
            ) : (
              <Table data={writers} marginTop='0.6'>
                <Table.Column prop='writerAddress' label='Address' render={renderAddress} />
                <Table.Column prop='writerDID' label='DID' render={renderDID} />
                <Table.Column prop='tokenName' label='Name' />
                <Table.Column prop='tokenSymbol' label='Symbol' />
                <Table.Column prop='tokenPrice' label='Price' />
                <Table.Column prop='writerDeployedContractAddress' label='Contract' render={renderContractAddress} />
              </Table>
            )
          }
        />
      </>
    </div>
  );
};
