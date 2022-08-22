import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import TokenAArtifact from "../contracts/TokenA.json";
import TokenBArtifact from "../contracts/TokenB.json";
import PairArtifact from "../contracts/Pair.json";
import swapFactoryArtifact from "../contracts/SwapFactory.json";
import swapLibraryArtifact from "../contracts/SwapLibrary.json";
import routerArtifact from "../contracts/Router.json";


import contractAddress from "../contracts/contract-address.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { GearFill } from 'react-bootstrap-icons';
import CurrencyField from './CurrencyField';
import './Dapp.css';
// This is the Hardhat Network id that we set in our hardhat.config.js.

const HARDHAT_NETWORK_ID = '1337';

const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends React.Component {


  constructor(props) {
    super(props);

    this.initialState = {
      // The info of the token (i.e. It's Name and symbol)
      tokenDataA: undefined,
      tokenDataB: undefined,
      // The user's address and balance
      selectedAddress: undefined,
      balanceA: undefined,
      balanceB: undefined,
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
      currentPairing: undefined,
      swapPrice: undefined,
    };

    this.setSwapPrice = this.setSwapPrice.bind(this);

    this.state = this.initialState;
  }



  render() {
    // Ethereum wallets inject the window.ethereum object. If it hasn't been
    // injected, we instruct the user to install MetaMask.
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet 
          connectWallet={() => this._connectWallet()} 
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    // If the token data or the user's balance hasn't loaded yet, we show
    // a loading component.
    if (!this.state.balanceA || !this.state.tokenDataB) {
      return <Loading />;
    }


    // If everything is loaded, we render the application.
    return (
      <>
        <div className="row">
          <div className="col-12">
            <h1>
              {'Phillips SwapDexv2'}
            </h1>
            <p>
              Welcome <b>{this.state.selectedAddress}</b>, you have{" "}
              <b>
                {this.state.balanceA.toString()} {this.state.tokenDataA.symbolA}
              </b>
              .
            </p>
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-12">
            {/* 
              Sending a transaction isn't an immediate action. You have to wait
              for it to be mined.
              If we are waiting for one, we show a message here.
            */}
            {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}

            {/* 
              Sending a transaction can fail in multiple ways. 
              If that happened, we show a message here.
            */}
            {this.state.transactionError && (
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={() => this._dismissTransactionError()}
              />
            )}
          </div>
        </div>


        <div className="DappBody">
        <div className="swapContainer">
          <div className="swapHeader">
            <span className="swapText">Swap</span>
            <span className="gearContainer" onClick={() => console.log("Should be log")}>
              <GearFill />
            </span>
            {/* {showModal && (
              <ConfigModal
                onClose={() => setShowModal(false)}
                setDeadlineMinutes={setDeadlineMinutes}
                deadlineMinutes={deadlineMinutes}
                setSlippageAmount={setSlippageAmount}
                slippageAmount={slippageAmount} />
            )} */}
          </div>

          <div className="swapBody">
            <CurrencyField
              field="input"
              tokenName={this.state.tokenDataA.nameA}
              signer={this._provider.getSigner(0)}
              setSwapPrice={this.setSwapPrice}
              balance={Number(this.state.balanceA)} />
            <CurrencyField
              field="output"
              tokenName={this.state.tokenDataB.nameB}
              value={0}
              balance={Number(this.state.balanceB)}
               />
          </div>

          <div className="ratioContainer">
              <>
                {'Swap Price is: ' + this.state.swapPrice}
              </>
          </div>

          <div className="swapButtonContainer">
              <div
                onClick={() => this._swapTokens()}
                className="swapButton"
              >
                Swap
              </div>
          </div>

        </div>
      </div>
      </>

    );
  }

  setSwapPrice(swapPrice) {

      console.log("lol does this hit");
      this.setState({ swapPrice: swapPrice});
  }  

  componentWillUnmount() {
    // We poll the user's balance, so we have to stop doing that when Dapp
    // gets unmounted
    this._stopPollingData();
  }

  async _connectWallet() {
    // This method is run when the user clicks the Connect. It connects the
    // dapp to the user's wallet, and initializes it.

    // To connect to the user's wallet, we have to run this method.
    // It returns a promise that will resolve to the user's address.
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    console.log(selectedAddress);

    this._initialize(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();

      if (newAddress === undefined) {
        return this._resetState();
      }
      
      this._initialize(newAddress);
    });
    
    // We reset the dapp state if the network is changed
    window.ethereum.on("chainChanged", ([networkId]) => {
      this._stopPollingData();
      this._resetState();
    });
  }

  _initialize(userAddress) {
    // This method initializes the dapp

    // We first store the user's address in the component's state
    this.setState({
      selectedAddress: userAddress,
    });

    // Then, we initialize ethers, fetch the token's data, and start polling
    // for the user's balance.

    // Fetching the token data and the user's balance are specific to this
    // sample project, but you can reuse the same initialization pattern.
    this._initializeEthers();
    this._getTokenDataA();
    this._getTokenDataB();


    // this._createPairing();

    // this._setUpPool();

    this._startPollingData();
  }

  async _initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    // Then, we initialize the contract using that provider and the token's
    // artifact. You can do this same thing with your contracts.
    this._tokenA = new ethers.Contract(
      contractAddress.TokenA,
      TokenAArtifact.abi,
      this._provider.getSigner(0)
    );

    this._tokenB = new ethers.Contract(
      contractAddress.TokenB,
      TokenBArtifact.abi,
      this._provider.getSigner(0)
    );

    this._pair = new ethers.Contract(
      contractAddress.Pair,
      PairArtifact.abi,
      this._provider.getSigner(0)
    );

    this._swapRouter = new ethers.Contract(
      contractAddress.Router,
      routerArtifact.abi,
      this._provider.getSigner(0)
    );

    this._swapLibrary = new ethers.Contract(
      contractAddress.SwapLibrary,
      swapLibraryArtifact.abi,
      this._provider.getSigner(0)
    );

    this._swapFactory = new ethers.Contract(
      contractAddress.SwapFactory,
      swapFactoryArtifact.abi,
      this._provider.getSigner(0)
    );

  }


  // Note that if you don't need it to update in near real time, you probably
  // don't need to poll it. If that's the case, you can just fetch it when you
  // initialize the app, as we do with the token data.
  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalances(), 60000);

    // We run it once immediately so we don't have to wait for it
    this._updateBalanceA();
    this._updateBalanceB();

  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  // The next two methods just read from the contract and store the results
  // in the component state.
  async _getTokenDataA() {
    const nameA = await this._tokenA.name();
    const symbolA = await this._tokenA.symbol();
    console.log(nameA);

    this.setState({ tokenDataA: { nameA, symbolA } });

  }

  async _getTokenDataB() {
    const nameB = await this._tokenB.name();
    const symbolB = await this._tokenB.symbol();

    this.setState({ tokenDataB: { nameB, symbolB } });
  }

  async _updateBalances() {
    this._updateBalanceA();
    this._updateBalanceB();
  }

  async _updateBalanceA() {
    const balanceA = await this._tokenA.balanceOf(this.state.selectedAddress);
    this.setState({ balanceA: balanceA });
  }

  async _updateBalanceB() {
    const balanceB = await this._tokenB.balanceOf(this.state.selectedAddress);
    this.setState({ balanceB: balanceB });
  }

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  async _createPairing() {

    try {
      const tempcurrentPairing = await this._swapFactory.createPairing(this._tokenA.address, this._tokenB.address);
      const currentPairing = await tempcurrentPairing.wait();
      const newPair = currentPairing.events;
      console.log(newPair);
      this.setState({ currentPairing: newPair });
    } catch (error) {
      console.log(error);
    }

  }

  async _setUpPool() {

    const initialSupplyPoolApproval = ethers.utils.hexZeroPad(ethers.utils.hexlify(20000), 16);
    const initialSupplyPool = ethers.utils.hexZeroPad(ethers.utils.hexlify(2000), 16);
    try {
      await this._tokenA.approve(contractAddress.Router, initialSupplyPoolApproval);
      await this._tokenB.approve(contractAddress.Router, initialSupplyPoolApproval);
      let mintTx = await this._swapRouter.addLiquidity(this._tokenA.address, this._tokenB.address,
        initialSupplyPool, initialSupplyPool, initialSupplyPool, initialSupplyPool, this.state.selectedAddress);
      const mintInfo = await mintTx.wait();
      console.log(mintInfo);
      this._updateBalances();
    } catch (error){
      console.error(error);
    }


  }

  // start working on swapping function, maybe work out the front end part first
  async _swapTokens() {

    try {
      const userInputAmount = document.getElementById('currencyInputField').value;
      console.log(userInputAmount);
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const pairContract = new ethers.Contract(
        this._swapFactory.allPairings(0),
        PairArtifact.abi,
        provider.getSigner(0)
      );  

      const swapLibraryContract = new ethers.Contract(
        contractAddress.SwapLibrary,
        swapLibraryArtifact.abi,
        provider.getSigner(0)
      );  

      const reservesTx = await pairContract.getReserves();
      // const reservesObj = await reservesTx.wait();
      console.log(reservesTx);

      const reserve0 = reservesTx[0];
      const reserve1 = reservesTx[1];


      const quotePrice = await this._swapLibrary.quote(userInputAmount, reserve0, reserve1);
      const amountInRequired = quotePrice.toNumber() * 1.04;

      await this._tokenA.approve(this.state.selectedAddress, amountInRequired);
      const resultTransfer = await this._tokenA.transferFrom(this.state.selectedAddress, this._swapFactory.allPairings(0), amountInRequired);
      console.log(resultTransfer);
      console.log("gets past transfer from");

      // const mintTx = await this._swapRouter.addLiquidity(this._tokenA.address, this._tokenB.address,
      //   initialSupplyPool, initialSupplyPool, initialSupplyPool, initialSupplyPool, this.state.selectedAddress);
      // const mintInfo = await mintTx.wait();

      // remember this is the output amount in the parameters
      const swapTokenTx = await pairContract.swap(0, userInputAmount, this.state.selectedAddress, "0x00");
      const swapResult = await swapTokenTx.wait();
      console.log(swapResult);

    } catch (error) {
      console.error(error);
    }


  }




}
