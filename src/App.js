import { useEffect, useState } from 'react';
import './App.css';
import contract from './contracts/contractMint.json';
import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { CONTRACT_ADDRESS, MANIFOLD_CONTRACT_ADDRESS, CHAIN_ID, CONTRACT_IMAGE } from './constants';


/*
  Author: SWMS.de
*/

const abi = contract.abi;
var messages = '';


function App() {

  const [currentAccount, setCurrentAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false)
  const [chainID, setChainId] = useState(0)


  // Check, if something has changed
  useEffect(() => {
    checkWalletIsConnected();
    if (typeof window.ethereum !== 'undefined') {
      const { ethereum } = window;

      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('Account changed', accounts[0]);
        setCurrentAccount(accounts[0])
        setChainId(ethereum.chainId);

      })
      window.ethereum.on('chainChanged', (chainId) => {
        console.log('Account changed', chainId);
        setChainId(chainId);
        if (chainId === CHAIN_ID) {
          setIsConnected(true);

        }

      })
    }
  }, [])

  const openEtherScanAction = () => {
    window.open("https://rinkeby.etherscan.io/address/" + MANIFOLD_CONTRACT_ADDRESS);
  }

  const checkWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      messages = "Make sure you have Metamask installed!";
      return;
    } else {
      messages = "Wallet exists! We're ready to go!";
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];

      messages = "Found an authorized account:" + account;
      setCurrentAccount(account);
      setChainId(ethereum.chainId);
    } else {
      console.log("No authorized account found");
    }
  }

  const connectWalletHandler = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      alert("Please install Metamask!");
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      console.log("Found an account! Address: ", accounts[0]);


      setCurrentAccount(accounts[0]);
      setIsConnected(true);
      const balance = await window.ethereum.request({ method: 'eth_getBalance', params: [accounts[0], 'latest'] });
      const wei = parseInt(balance, 16)
      const gwei = (wei / Math.pow(10, 9)) // parse to Gwei
      const eth = (wei / Math.pow(10, 18))// parse to ETH
      console.log('Balance', wei, gwei, eth);
      console.log(ethereum.chainId);
      setChainId(ethereum.chainId);




    } catch (err) {
      console.log(err)
    }
  }
  const handleDisconnect = async () => {

    console.log('Disconnecting MetaMask...')
    setIsConnected(false)
    setCurrentAccount(null)
  }
  const mintNftHandler = async () => {
    try {
      const { ethereum } = window;
      setIsLoading(true);

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const nftContract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
        console.log("Initialize payment");

        var tokenUri = CONTRACT_IMAGE;

        var tokenName = 'TestToken 0001';
        var tokenDescription = 'This is a nice token';
        var attributes = '[{"trait_type": "Artist", "value": "SWMS"}]';

        let nftTxn = await nftContract.mint(1, tokenName, tokenDescription, tokenUri, attributes, { value: ethers.utils.parseEther("0.01") });

        console.log("Mining... please wait");
        await nftTxn.wait();
        setIsLoading(false);
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

      } else {
        console.log("Ethereum object does not exist");

        setIsLoading(false);
      }

    } catch (err) {
      setIsLoading(false);
      console.log(err);
    }
  }

  const connectWalletButton = () => {
    if (!isConnected) {
      return (
        <button onClick={connectWalletHandler} className='cta-button connect-wallet-button'>
          Connect Wallet
        </button>
      )
    } else if (chainID !== CHAIN_ID) {
      return (
        <button onClick={connectWalletHandler} className='cta-button connect-wallet-button'>
          wrong Network
        </button>
      )

    }

    else {
      return (
        <button onClick={handleDisconnect} className='cta-button connect-wallet-button'>
          Disconnect
        </button>
      )
    }

  }

  const mintNftButton = () => {
    if (isConnected && chainID === CHAIN_ID) {
      return (
        <button
          type="button"
          className="cta-button mint-button"
          onClick={mintNftHandler}
        >Mint for 0.01 ETH </button>
      )
    }
  }

  const renderNftImage = () => {
    return (
      <img
        src={CONTRACT_IMAGE}
        width='50%'
        alt='SWMS' />

    );
  };

  const renderLoading = () => {
    if (isLoading === true) {
      return (
        <div className='loader'>
          <img
            src='./loading.gif'
            width='20%'
            alt='loading' />
        </div>
      )
    }
  }

  const renterInfos = () => {
    return messages;

  }


  const renderNftData = () => {
    return (
      <div>
        <h1>SWMS //</h1>
        <div className="attributelist">
          <table cellPadding={15} cellSpacing={10}>
            <tbody>
              <tr>
                <td>Contract</td>
                <td>{MANIFOLD_CONTRACT_ADDRESS}</td>
              </tr>
              <tr>
                <td>Price</td>
                <td>0.01</td>
              </tr>
              <tr>
                <td>Artist</td>
                <td>SWMS</td>
              </tr>
            </tbody>
          </table>

        </div>
        <button
          className="opensea-button"
          onClick={openEtherScanAction}
        >
          View on Etherscan
        </button>
      </div>

    );
  };


  return (
    <div className='main-app'>
      {renderLoading()}
      <div className="swms container main">
        <div className="swms header">{connectWalletButton()}{mintNftButton()}</div>
        <div className="swms overview-container">
          <div className="swms nft-container">
            <div className="swms image-container">
              {renderNftImage()}
            </div>
            <div className="swms data-container">
              {renderNftData()}
            </div>
            <div className="info-container">{renterInfos()}</div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default App;