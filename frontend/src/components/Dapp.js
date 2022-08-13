import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import TokenAArtifact from "../contracts/TokenA.json";
import TokenBArtifact from "../contracts/TokenB.json";
import PairArtifact from "../contracts/TokenB.json";
import swapFactoryArtifact from "../contracts/SwapFactory.json";


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
    };

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
    if (!this.state.tokenDataA || !this.state.balanceA || !this.state.tokenDataB) {
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
              getSwapPrice={1.5}
              balance={Number(this.state.balanceA)} />
            <CurrencyField
              field="output"
              tokenName={this.state.tokenDataB.nameB}
              defaultValue={22}
              balance={Number(this.state.balanceB)}
               />
          </div>

          <div className="ratioContainer">
              <>
                {'Stuff'}
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

    // Once we have the address, we can initialize the application.

    // First we check the network
    if (!this._checkNetwork()) {
      return;
    }

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
    this._getTokenDataB();
    this._getTokenDataA();


    this._createPairing();

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
    this._pollDataInterval = setInterval(() => this._updateBalances(), 1000);

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
    const nameA = await this._tokenA.nameA();
    const symbolA = await this._tokenA.symbolA();

    this.setState({ tokenDataA: { nameA, symbolA } });

  }

  async _getTokenDataB() {
    const nameB = await this._tokenB.nameB();
    const symbolB = await this._tokenB.symbolB();

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

  // This method checks if Metamask selected network is Localhost:8545 
  _checkNetwork() {
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
      return true;
    }

    this.setState({ 
      networkError: 'Please connect Metamask to Localhost:8545'
    });

    return false;
  }


  // start working on adding liquidity 
  // Then on actually swapping, then make UI look nice 
  // Then prob implement spinner 
  // Then impelement making more pairs and making it scalable

  async _createPairing() {
    try {
      console.log(this._tokenA.address, this._tokenB.address);
      console.log("----");
      const pairAddress = await this._swapFactory.createPairing(this._tokenA.address, this._tokenB.address);
      console.log(pairAddress);
      console.log("@@@@@@@@@@@@@@@@@@@@");
      console.log(this._swapFactory.allPairings[0]);
    } catch (error) {
      console.log(this._swapFactory.allPairings[0]);
      console.log(error);
    }

  }

  // need to figure out how to register pair and then how to call that pair contract
  async _swapTokens() {
    console.log("gets to swapToken");
    console.log(this._swapFactory.allPairings[0]);
    // const currentPairContract = new ethers.Contract
    // const pairLiquidity = this._pair

  }



  async _setUpDexFunction() {
    
  }


  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // async _transferTokens(to, amount) {
  //   // Sending a transaction is a complex operation:
  //   //   - The user can reject it
  //   //   - It can fail before reaching the ethereum network (i.e. if the user
  //   //     doesn't have ETH for paying for the tx's gas)
  //   //   - It has to be mined, so it isn't immediately confirmed.
  //   //     Note that some testing networks, like Hardhat Network, do mine
  //   //     transactions immediately, but your dapp should be prepared for
  //   //     other networks.
  //   //   - It can fail once mined.
  //   //
  //   // This method handles all of those things, so keep reading to learn how to
  //   // do it.

  //   try {
  //     // If a transaction fails, we save that error in the component's state.
  //     // We only save one such error, so before sending a second transaction, we
  //     // clear it.
  //     this._dismissTransactionError();

  //     // We send the transaction, and save its hash in the Dapp's state. This
  //     // way we can indicate that we are waiting for it to be mined.
  //     const tx = await this._token.transfer(to, amount);
  //     this.setState({ txBeingSent: tx.hash });

  //     // We use .wait() to wait for the transaction to be mined. This method
  //     // returns the transaction's receipt.
  //     const receipt = await tx.wait();

  //     // The receipt, contains a status flag, which is 0 to indicate an error.
  //     if (receipt.status === 0) {
  //       // We can't know the exact error that made the transaction fail when it
  //       // was mined, so we throw this generic one.
  //       throw new Error("Transaction failed");
  //     }

  //     // If we got here, the transaction was successful, so you may want to
  //     // update your state. Here, we update the user's balance.
  //     await this._updateBalance();
  //   } catch (error) {
  //     // We check the error code to see if this error was produced because the
  //     // user rejected a tx. If that's the case, we do nothing.
  //     if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
  //       return;
  //     }

  //     // Other errors are logged and stored in the Dapp's state. This is used to
  //     // show them to the user, and for debugging.
  //     console.error(error);
  //     this.setState({ transactionError: error });
  //   } finally {
  //     // If we leave the try/catch, we aren't sending a tx anymore, so we clear
  //     // this part of the state.
  //     this.setState({ txBeingSent: undefined });
  //   }
  // }

}
