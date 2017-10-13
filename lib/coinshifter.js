exports = module.exports = {}

const trade = exports.trade = (term) => {
  let accounts = []
  let wallet_choices = []
  let src_account, dest_account
  let src_address, dest_address
  let marketinfo
  let spend_amt
  return new Promise( (resolve, reject) => {
    //  Get a list of accounts
    coinbase.accounts()
    //  Get source account
    .then( (_accounts) => {
      accounts = _accounts

      wallet_choices = _.map(accounts, (a) => {
        return {
          name: `${a.name} (${a.balance.amount} ${a.balance.currency})`,
          value: a.id,
          currency: a.balance.currency,
          amount: parseFloat(a.balance.amount)
        }
      })

      non_empty_wallets = _.filter( wallet_choices, (a) => {
        return a.amount > 0
      })

      if( non_empty_wallets.length == 0 ) {
        term.log(`You have no wallets with a non-0 balance.`)
        callback()
        return
      }

      return term.prompt({
        type: 'list',
        name: 'src_account',
        message: 'What do you want to sell?',
        choices: non_empty_wallets
      })
    })
    //  Get destination account
    .then( (src_choice) => {
      src_account = _.find(accounts, (a) => a.id == src_choice.src_account)
      return term.prompt({
        type: 'list',
        name: 'dest_account',
        message: 'What do you want to buy?',
        choices: _.filter(wallet_choices, c => c.currency != src_account.balance.currency)
      })
    })
    //  Get market rate
    .then( (dest_choice) => {
      dest_account = _.find(accounts, (a) => a.id == dest_choice.dest_account)
      return shapeshift.exchange_rate(src_account.balance.currency, dest_account.balance.currency)
    })
    //  Get amount to send
    .then( (_marketinfo) => {
      marketinfo = _marketinfo
      term.log(`  Rate\t\t1 ${src_account.balance.currency} = ${marketinfo.rate} ${dest_account.balance.currency}`)
      term.log(`  Miner Fee\t${marketinfo.minerFee} ${dest_account.balance.currency}`)
      return term.prompt({
        type: 'input',
        name: 'spend_amt',
        message: `How much ${src_account.balance.currency} do you want to spend: `,
        validate: (value) => {
          value = parseFloat(value)
          if( isNaN(value) ) {
            return `Please provide a valid number for the ${src_account.balance.currency} spend quantity!`
          }
          if( value > parseFloat( src_account.balance.amount ) ) {
            return `You don't have that much ${src_account.balance.currency}!`
          }
          if( value > marketinfo.limit ) {
            return `Unfortunately, you cannot exchange more than ${marketinfo.limit} ${src_account.balance.currency} at a time.`
          }
          if( value < marketinfo.minimum ) {
            return `You must send more than ${marketinfo.minimum} ${src_account.balance.currency}`
          }
          return true
        }
      })
    } )
    //  Confirm purchase
    .then( (spend_answer) => {
      spend_amt = parseFloat( spend_answer.spend_amt )
      return coinbase.get_spot_price([src_account.balance.currency, dest_account.balance.currency])
    })
    .then( (price_data) => {
      let estimate_recvd = marketinfo.rate * spend_amt - marketinfo.minerFee
      let send_spot_valuation = price_data[src_account.balance.currency] * spend_amt
      let receive_spot_valuation = price_data[dest_account.balance.currency] * estimate_recvd
      term.log(`Send:\t\t${spend_amt} ${src_account.balance.currency} ($${send_spot_valuation}USD)`)
      term.log(`Receive:\t${estimate_recvd} ${dest_account.balance.currency} ($${receive_spot_valuation}USD)`)
      return term.prompt({
        type: 'confirm',
        name: 'proceed',
        message: 'Proceed with exchange?'
      })
    } )
    .then( (proceed_answer) => {
      if( proceed_answer.proceed ) {
        //return execute_exchange(term, src_account, spend_amt, dest_account)
      } else {
        term.log(`Trade aborted.`)
        resolve(true)
      }
    })
    .catch( (err) => {
      reject(err)
    })
  })
}

const execute_exchange = exports.execute_exchange = (term, src_account, amount, dest_account) => {
  return new Promise( (resolve, reject) => {
    let src_address, dest_address
    //  Get new addresses for both accounts
    return coinbase.get_new_addresses( [src_account, dest_account] )
    //  Get a shapeshift transaction
    .then( (new_addresses) => {
      src_address = new_addresses[ src_account.id ]
      dest_address = new_addresses[ dest_account.id ]

      return shapeshift.shift(src_account.balance.currency, dest_account.balance.currency, src_address, dest_address)
    })
    //  Send the funds!
    .then( (shapeshift_response) => {
      return coinbase.send_money(src_account, amount, shapeshift_response.deposit)
    })
    .then( (transaction_confirmation) => {
      term.log(`Transaction completed:`)
      console.dir(transaction_confirmation)
    } )
    .catch( (err) => {
      reject(err)
    })
  })
}
