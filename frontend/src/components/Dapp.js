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
import PageButton  from "./PageButton"
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { GearFill } from 'react-bootstrap-icons';
import CurrencyField from './CurrencyField';
import { Link } from 'react-router-dom';


import './Dapp.css';
// This is the Hardhat Network id that we set in our hardhat.config.js.

const HARDHAT_NETWORK_ID = '1337';

const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends React.Component {


  constructor(props) {
    super(props);

    this.initialState = {
      tokenDataA: undefined,
      tokenDataB: undefined,
      selectedAddress: undefined,
      tokenAddressA: undefined,
      tokenAddressB: undefined,
      balanceA: undefined,
      balanceB: undefined,
      // The ID about  being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
      currentPairing: undefined,
      swapPrice: undefined,
      swapOutputAmount: undefined,
      allPairStrings: undefined,
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

    // // If the token data or the user's balance hasn't loaded yet, we show
    // // a loading component.
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
              tokenSymbol={this.state.tokenDataA.symbolA}
              tokenAddress={this.state.tokenAddressA}
              signer={this._provider.getSigner(0)}
              setSwapPrice={this.setSwapPrice}
              balance={Number(this.state.balanceA)} />
          <button
            className="switchButton"
            type="button"
            onClick={() => this._switchButtonState(this.state.tokenAddressB, this.state.tokenAddressA)}
          >
            ↓
          </button>
            <CurrencyField
              field="output"
              tokenName={this.state.tokenDataB.nameB}
              tokenSymbol={this.state.tokenDataB.symbolB}
              tokenAddress={this.state.tokenAddressB}
              value={this.state.swapOutputAmount}
              balance={Number(this.state.balanceB)}
               />
          </div>

          <div className="ratioContainer">
              <>
                {'1 ' + this.state.tokenDataA.symbolA + ' = ' + this.state.swapPrice + ' ' + this.state.tokenDataB.symbolB}
              </>
          </div>

          <div className="swapButtonContainer">
              <div
                onClick={() => this._swapTokens(this.state.tokenAddressA, this.state.tokenAddressB)}
                className="swapButton"
              >
                Swap
              </div>
          </div>

        </div>

        <div>Create Pairing: </div>
        <input type="text" id="addresstoken0" placeholder="Address0" />
        <input type="text" id="addresstoken1" placeholder="Address1" />
        <button
            className="createPairButton"
            type="button"
            onClick={() => this._createNewPairing()}
          >Create Pairing </button>    



        <div>Switch current Pairing</div> 
        <select id="selectpair" onChange={() => this._loadPair()}>
          <option>Choose Pair</option>
        </select>
           </div>


           
      </>

    );



  }



  

  setSwapPrice(swapPrice) {

      const userInputAmount = document.getElementById('currencyInputField').value;
      var userOutputAmount;

      if (userInputAmount.length <= 0){
        this.setState({ swapPrice: 0});
        this.setState({ swapOutputAmount: 0});
      } else {
        userOutputAmount = userInputAmount * swapPrice;
        this.setState({ swapPrice: swapPrice});
        this.setState({ swapOutputAmount: userOutputAmount});
      }

  }

  async _loadPair() {
    const f = document.getElementById("selectpair");
    var selectedOption = f.options[f.selectedIndex].value;

    console.log("get to the onchange handler");
    console.log(selectedOption);
    const addresses = selectedOption.split(',');
    console.log(addresses[0]);
    console.log(addresses[1]);

    this._switchButtonState(addresses[0], addresses[1]);
  }


  resetSwapPrice() {
    const userInputAmount = document.getElementById('currencyInputField');
    userInputAmount.value = 0;
    this.setState({ swapPrice: 0});
    this.setState({ swapOutputAmount: 0});
  }

  componentWillUnmount() {

    this._stopPollingData();
  }



  async _connectWallet() {

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

    this._createPairing();

    this._setUpPool();

    this._getPairingData();
    this._startPollingData();


  }

  async _getPairingData() {

    const allPoolsLength = await this._swapFactory.getPairingSize();
    var allPools = [];
    var allPairContracts = [];
    for (var i = 0; i < allPoolsLength; i++){
      const optionContract = new ethers.Contract(
        this._swapFactory.allPairings(i),
        PairArtifact.abi,
        this._provider.getSigner(0)
      );

      const optionTokenA = new ethers.Contract(
        optionContract.token0(),
        PairArtifact.abi,
        this._provider.getSigner(0)
      ); 

      const optionTokenB = new ethers.Contract(
        optionContract.token1(),
        PairArtifact.abi,
        this._provider.getSigner(0)
      ); 


      const tokenAsymbol = await optionTokenA.symbol();
      const tokenAaddressOption = await optionTokenA.address;
      const tokenBsymbol = await optionTokenB.symbol();
      const tokenBaddressOption = await optionTokenB.address;
      var tokenAddressPool = [];
      tokenAddressPool.push(tokenAaddressOption);
      tokenAddressPool.push(tokenBaddressOption);

      const optionString = "(" + tokenAsymbol + "," + tokenBsymbol + ")";
      allPools.push(optionString);
      allPairContracts.push(tokenAddressPool);
    }


    this.setState({ allPairStrings: allPools});
    const select = document.getElementById("selectpair");

    for (var i = 0; i < allPools.length; i++){
      var el = document.createElement("option");
      el.textContent = allPools[i];
      el.value = allPairContracts[i];
      select.appendChild(el);
    }

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


  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalances(), 10000);

    // We run it once immediately so we don't have to wait for it
    this._updateBalanceA();
    this._updateBalanceB();

  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _getTokenDataA() {
    const nameA = await this._tokenA.name();
    const symbolA = await this._tokenA.symbol();

    this.setState({ tokenDataA: { nameA, symbolA }, tokenAddressA: this._tokenA.address });

  }

  async _getTokenDataB() {
    const nameB = await this._tokenB.name();
    const symbolB = await this._tokenB.symbol();

    this.setState({ tokenDataB: { nameB, symbolB }, tokenAddressB: this._tokenB.address });
  }

  async _updateBalances() {
    this._updateBalanceA();
    this._updateBalanceB();
  }

  // going to attempt to switch tokens and see what happens 
  async _switchButtonState(tokenAddressA, tokenAddressB) {
    const _newTokenA = new ethers.Contract(
      tokenAddressA,
      TokenAArtifact.abi,
      this._provider.getSigner(0)
    );

    const _newTokenB = new ethers.Contract(
      tokenAddressB,
      TokenBArtifact.abi,
      this._provider.getSigner(0)
    );


    this._tokenA = _newTokenA;
    this._tokenB = _newTokenB;
    this._getTokenDataA();
    this._getTokenDataB();
    this._updateBalanceA();
    this._updateBalanceB()
  }


  async _updateBalanceA() {
    const balanceA = await this._tokenA.balanceOf(this.state.selectedAddress);
    this.setState({ balanceA: balanceA });
  }

  async _updateBalanceB() {
    const balanceB = await this._tokenB.balanceOf(this.state.selectedAddress);
    this.setState({ balanceB: balanceB });
  }

  // _dismissTransactionError() {
  //   this.setState({ transactionError: undefined });
  // }

  // _dismissNetworkError() {
  //   this.setState({ networkError: undefined });
  // }


  // _getRpcErrorMessage(error) {
  //   if (error.data) {
  //     return error.data.message;
  //   }

  //   return error.message;
  // }

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


    this._getPairingData();



  }


  async _createNewPairing() {

    const addressToken0 = document.getElementById('addresstoken0');
    const addressToken1 = document.getElementById('addresstoken1');

    console.log(addressToken0.value);
    console.log(addressToken1.value);
    console.log("get here");

    try {
      const tempcurrentPairing = await this._swapFactory.createPairing(addressToken0.value, addressToken1.value);
      const currentPairing = await tempcurrentPairing.wait();
      const newPair = currentPairing.events;
      console.log(newPair);
      alert("New Pair has been created");
    } catch (error) {
      console.log(error);
    }

    addressToken0.value = '';
    addressToken1.value = '';

    this._getPairingData();

  }






  // set up the liquidity pool for the current pair in state
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

  // logic for the actual swapping
  async _swapTokens(tokenAddressA, tokenAddressB) {

    try {
      const userInputAmount = document.getElementById('currencyInputField').value;
      console.log(userInputAmount);
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const pairContract = new ethers.Contract(
        this._swapFactory.allPairings(0),
        PairArtifact.abi,
        provider.getSigner(0)
      );  

      const reservesTx = await pairContract.getReserves();
      console.log(reservesTx);

      const token0Address = await pairContract.token0();

      var reserve0;
      var reserve1;
      console.log(token0Address);
      if (tokenAddressA === token0Address){
        reserve0 = reservesTx[0];
        reserve1 = reservesTx[1]; 
      } else {
        reserve0 = reservesTx[1];
        reserve1 = reservesTx[0];   
      }
      const quotePrice = await this._swapLibrary.getAmountOut(userInputAmount, reserve0, reserve1);
      await this._tokenA.approve(this.state.selectedAddress, userInputAmount);
      const resultTransfer = await this._tokenA.transferFrom(this.state.selectedAddress, this._swapFactory.allPairings(0), userInputAmount);

      // remember this is the output amount in the parameters
      const swapTokenTx = await pairContract.swap(0, quotePrice, this.state.selectedAddress, "0x00");
      const swapResult = await swapTokenTx.wait();

      this.resetSwapPrice();

    } catch (error) {
      console.error(error);
    }


  }



}

export default Dapp;

