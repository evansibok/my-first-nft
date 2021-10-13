import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";

import twitterLogo from './assets/twitter-logo.svg';
import { CONTRACT_ADDRESS, OPENSEA_LINK, TOTAL_MINT_COUNT, TWITTER_HANDLE, TWITTER_LINK, RINKEBY_CHAIN_ID, OPENSEA_COLLECTION } from './utils/constants';
import SenseiNFT from './utils/SenseiNFT.json';

import './styles/App.css';

const App = () => {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [mintMessage, setMintMessage] = useState('');
  const [totalNftMinted, setTotalNftMinted] = useState(0);
  const [linkToNFT, setLinkToNFT] = useState('');
  const [loading, setLoading] = useState(false);

  const checkConnectedWallet = useCallback(async () => {
    const { ethereum } = window;

    if (!ethereum) {
      alert("Make sure you have metamask extension installed!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const ethAccounts = await ethereum.request({ method: 'eth_accounts' });

    const chainId = await ethereum.request({ method: 'eth_chainId' });

    if (chainId !== RINKEBY_CHAIN_ID) {
      alert("You are not connected to the Rinkeby Test Network!");
    } else if (ethAccounts.length !== 0) {
      const account = ethAccounts[0];
      setCurrentAccount(account)

      setupEventListener();
    } else {
      console.log("No authorized account found!");
      setLoading(false);
    }
  }, [])

  useEffect(() => {
    checkConnectedWallet();
  }, [checkConnectedWallet])

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Please get Metamask to proceed!');
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      })

      setCurrentAccount(accounts[0]);

      setupEventListener();
    } catch (err) {
      console.log('Failed to connect::::', err);
      setLoading(false);
    }
  }

  const askContractToMintNFT = async () => {
    try {
      setLoading(true);
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, SenseiNFT.abi, signer);

        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await connectedContract.makeSenseiNFT();

        console.log("Mining...please wait.")
        await nftTxn.wait();

        // console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
      } else {
        console.log('Ethereum object doesn\'t exist!');
        setLoading(false);
      }
      setLoading(false);
    } catch (err) {
      console.log('Minting failed::::', err);
      setLoading(false);
    }
  }

  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, SenseiNFT.abi, signer);

        setLoading(true);
        let totalNfts = await connectedContract.getTotalNFTS();
        setTotalNftMinted(totalNfts.toNumber());
        setLoading(false);

        connectedContract.on('TotalNFTMinted', (totalNfts) => {
          setTotalNftMinted(totalNfts.toNumber());
        })

        connectedContract.on('NewSenseiNFTMinted', (from, tokenId) => {
          setMintMessage(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: `);
          setLinkToNFT(`${OPENSEA_LINK}/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
        })
      } else {
        console.log('Ethereum object doesn\'t exist!');
        setLoading(false);
      }

    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }

  const goToOpenSea = () => {
    window.open(`${OPENSEA_LINK}/collection/${OPENSEA_COLLECTION}`, '_blank')
  }

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>
      {
        loading ? 'loading...' : 'Connect to Wallet'
      }
    </button>
  );

  const renderOpenSeaButton = () => (
    <button
      className={`opensea-button cta-button ${(totalNftMinted === 0 || loading) ? 'disabled' : ''}`}
      onClick={goToOpenSea}
      disabled={totalNftMinted === 0 || loading}
    >
      🌊 View Collection on OpenSea
    </button>
  )

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">Evans' NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          <p className="mini-text">
            {mintMessage}
            {
              linkToNFT.length > 0 && (<a href={linkToNFT} className='mini-text linked'>
                New NFT on OpenSea
              </a>)
            }
          </p>
          {!currentAccount ? renderNotConnectedContainer()
            : (
              <button className="cta-button mint-button" onClick={askContractToMintNFT}>
                {
                  loading ? 'Loading...' : 'Mint NFT'
                }
              </button>)
          }
          <p
            className="sub-text mint-count"
            style={{
              color: totalNftMinted === TOTAL_MINT_COUNT && '#EB3349'
            }}
          >
            {totalNftMinted}/{TOTAL_MINT_COUNT} NFTs Minted
          </p>
        </div>
        <div>
          {renderOpenSeaButton()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
