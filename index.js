/**
 *  Description  View Coinbase assets and make currency exchanges from the CLI
 *  Author       Mark Solters (msolters@gmail.com)
 *  License      MIT
 */

fs = require("fs")
settings = JSON.parse( fs.readFileSync("settings.json", "utf8") )
vorpal = require('vorpal')()
_ = require('underscore')
shapeshift = require('./lib/shapeshift.js')
coinbase = require('./lib/coinbase.js')
const coinshifter = require('./lib/coinshifter.js')

//  accounts
vorpal
  .command('accounts', 'View accounts in Coinbase wallet.')
  .action( function(args, callback) {
    let self = this
    let accounts = []

    coinbase.accounts()
    .then( (_accounts) => {
      accounts = _accounts
      //console.dir(accounts)
      for( acc of accounts ) {
        self.log(`${acc.name}`)
        self.log(`- ${acc.balance.amount} ${acc.balance.currency}`)
        //self.log(`\tAddress:\t${acc.address}`)
      }
    })
    .catch( (err) => {
      console.error(err)
    })
    .finally( () => {
      callback()
    })
  })

vorpal
  .command('transactions [account]', 'View Coinbase transactions. Provide an account name to view transactions for a specific currency.')
  .action( function(args, callback) {
    coinbase.transactions(args.account)
    .then( (results) => {
      console.dir(results)
    })
    .catch( (err) => {
      console.error(err)
    })
    .finally( () => {
      callback()
    })
  })

//  rate
vorpal
  .command('rate <coin1> <coin2>', 'Get the current exchange rate between two cryptocurrencies.')
  .action( function(args, callback) {
    shapeshift.exchange_rate(args.coin1, args.coin2)
    .then( (results) => {
      console.dir(results)
    })
    .catch( (err) => {
      console.error(err)
    })
    .finally( () => {
      callback()
    })
  })

//  traded coin1 amt coin2
vorpal
  .command('traded <amt> <coin1> <coin2>', 'Exchange amt of coin1 to coin2')
  // TODO: disable confirmation .option()
  .action( function(args, callback) {
    let src_address, dest_address, deposit_address
    //  Get src_address and deposit_address from coinbase
    coinbase.accounts()

    //  Get exchange rate
    .then( (accounts) => {
      //src_address = ?
      //dest_address = ?

      return shapeshift.shift(args.coin1, args.coin2, src_address, dest_address)
    } )

    //  Confirm exchange rate and fee
    .then( (shift_data) => {
      console.dir(shift_data)
      deposit_address = shift_data.depositAddress
      //  Print trade summary
      this.log(``)
      //  Trade confirmation prompt:
      return this.prompt({
        type: 'confirm',
        name: 'continue',
        default: true,
        message: 'Execute trade:',
      }, function(result){
        if (result.continue) {

        } else {

        }
      })
    })
    //.then()
    .catch( (err) => {
      console.error(err)
    })
    .finally( () => {
      callback()
    })
  })

//  price coin1
vorpal
  .command('price <coin>')
  .action( function(args) {
    let self = this
    return coinbase.get_spot_price( args.coin )
    .then( (price_data) => {
      self.log(price_data)
    })
  })

//  trade
vorpal
  .command('trade', 'Interactive trade wizard.')
  .action( function(args) {
    return coinshifter.trade(this)
    /*
    .finally( () => {
      callback()
    })
    */
  })

//  Entry Point
vorpal
  .delimiter('coinshifter$')
  .show()
  //.ui.submit('rate btc ltc')
