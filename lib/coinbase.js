const Coinbase = require('coinbase')
const Client = Coinbase.Client
const Account = Coinbase.model.Account

const coinbase_client = new Client({
  'apiKey': settings.coinbase.api.key,
  'apiSecret': settings.coinbase.api.secret,
  'version': settings.coinbase.api.version
})

exports = module.exports = {}

const accounts = exports.accounts = () => {
  return new Promise( (resolve, reject) => {
    coinbase_client.getAccounts({}, function(err, accounts) {
      if(err) {
        reject(err)
        return
      }
      resolve(accounts)
    })
  })
}

exports.transactions = (acct=null) => {
  return new Promise( (resolve, reject) => {
    accounts()
    .then( (accounts) => {
      // TODO: if accounts, filter by acct.name, else traverse
      if( acct ) {

      } else {
        accounts.forEach( function(_acct) {
          console.log(_acct.name + ': ' + _acct.balance.amount + ' ' + _acct.balance.currency)
          _acct.getTransactions(null, function(err, txns) {
            txns.forEach(function(txn) {
              console.log('txn: ' + txn.id)
            })
          })
        })
      }
    })
    .catch( (err) => {
      reject(err)
    })
  })
}


exports.get_new_addresses = (accts) => {
  let new_addresses = {}
  console.log(`Generating new wallet addresses...`)
  return new Promise( (resolve, reject) => {
    for( let acc of accts ) {
      acc.createAddress( null, function(err, results) {
        if( err ) {
          reject(err)
          return
        }
        new_addresses[acc.id] = results.address
        if( Object.keys(new_addresses).length == accts.length ) {
          resolve( new_addresses )
        }
      })
    }
  })
}

const send_money = exports.send_money = (src_acct, amount, dest_address) => {
  return new Promise( (resolve, reject) => {
    let send_opts = {
      "to": dest_address,
      "amount": amount.toString(),
      "currency": src_acct.balance.currency,
      "description": `Coinshifter.js CLI Exchange`
    }
    console.log(send_opts)
/*
    src_acct.sendMoney(send_opts, function(err, txn) {
      if( err ) {
        reject(err)
        return
      }
      resolve(txn)
    })
*/
  })
}

const get_spot_price = exports.get_spot_price = ( coins ) => {
  if( !Array.isArray(coins) ) {
    coins = [ coins ]
  }
  let prices = {}
  return new Promise( (resolve, reject) => {
    for( let coin of coins ) {
      coinbase_client.getSpotPrice({currencyPair: `${coin}-USD`}, function(err, price_data) {
        if( err ) {
          reject(err)
          return
        }
        prices[coin] = parseFloat(price_data.data.amount)
        if( coins.length == Object.keys(prices).length ) {
          resolve(prices)
        }
      })
    }
  })
}
