import React from 'react';
import { ethers } from "ethers";
import swapFactoryArtifact from "../contracts/SwapFactory.json";
import contractAddress from "../contracts/contract-address.json";

import PairArtifact from "../contracts/Pair.json";

const CurrencyField = props => {

  const getPrice = (value) => {
    const price = _getSwapPrice(value);
    return price;
  }


  const  _getSwapPrice =  async() => {

    var swapPrice;
    try {
      const userInputAmount = document.getElementById('currencyInputField').value;
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const swapFactoryContract = new ethers.Contract(
        contractAddress.SwapFactory,
        swapFactoryArtifact.abi,
        provider.getSigner(0)
      );


      const loggingOutput = await swapFactoryContract.allPairings(0);
      const pairContract = new ethers.Contract(
        loggingOutput,
        PairArtifact.abi,
        provider.getSigner(0)
      );  

      const allegedPriceTx = await pairContract.getSwapPrice(userInputAmount, 0, '0xd34117a3679555a44869e26d9e7605a8017c500f');
      const allegedPriceInfo = await allegedPriceTx.wait();
      const swapPriceTemp = allegedPriceInfo.events;
      console.log(swapPriceTemp);
      swapPrice = swapPriceTemp[0].data / 1000;

      console.log(swapPrice);

      props.setSwapPrice(swapPrice);

    } catch (error) {
      console.log(error);
    }
    return swapPrice;

  }

  const message = 'Balance: ' + String(props.balance?.toFixed(3));

  return (
    <div className="row currencyInput">
      <div className="col-md-6 numberContainer">

          <input
            id="currencyInputField"
            className="currencyInputField"
            placeholder="0.0"
            value={props.value}
            onBlur={e => (props.field === 'input' ? getPrice(e.target.value) : null)}
          />
      </div>
      <div className="col-md-6 tokenContainer">
        <span className="tokenName">{props.tokenName}</span>
        <div className="balanceContainer">
          <span className="balanceAmount">{message}</span>
        </div>
      </div>
    </div>
  )
}

export default CurrencyField
