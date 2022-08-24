import React from 'react';
import { ethers } from "ethers";
import swapFactoryArtifact from "../contracts/SwapFactory.json";
import contractAddress from "../contracts/contract-address.json";
import swapLibraryArtifact from "../contracts/SwapLibrary.json";

import PairArtifact from "../contracts/Pair.json";

const CurrencyField = props => {

  const getPrice = (value) => {
    const price = _getSwapPrice(value);
    return price;
  }


  const  _getSwapPrice =  async() => {

    var swapPrice;
    const userInputAmount = document.getElementById('currencyInputField').value;
    if (userInputAmount.length <= 0){
      props.setSwapPrice(0);
      return 0;
    }



    try {
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

      const libraryContract = new ethers.Contract(
        contractAddress.SwapLibrary,
        swapLibraryArtifact.abi,
        provider.getSigner(0)
      );

      const reservesTx = await pairContract.getReserves();

      // don't think the reserves are corret when doing state switch
      var reserve0;
      var reserve1;
      const token0Address = await pairContract.token0();
      console.log(token0Address);
      if (props.tokenAddress == token0Address){
        reserve0 = reservesTx[0];
        reserve1 = reservesTx[1]; 
      } else {
        reserve0 = reservesTx[1];
        reserve1 = reservesTx[0];   
      }      
      const quotePrice = await libraryContract.getAmountOut(userInputAmount, reserve0.toNumber(), reserve1.toNumber());
      console.log(quotePrice);

      const swapPrice = quotePrice.toNumber() / userInputAmount;

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
        <span className="tokenName">{props.tokenName + ' (' + props.tokenSymbol + ') '}</span>
        <div className="balanceContainer">
          <span className="balanceAmount">{message}</span>
        </div>
      </div>
    </div>
  )
}

export default CurrencyField
