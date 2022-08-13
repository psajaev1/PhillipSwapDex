import React from 'react'

const CurrencyField = props => {

  const getPrice = (value) => {
    return value
  }

  const message = 'Balance: ' + String(props.balance?.toFixed(3));

  return (
    <div className="row currencyInput">
      <div className="col-md-6 numberContainer">

          <input
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