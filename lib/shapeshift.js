const ShapeshiftClient = require('shapeshift.io')
const SHAPESHIFT_PUBLIC_KEY = settings.shapeshift.api.private

exports = module.exports = {}

/**
 *  Get the current exchange rate for two coins.
 */
const exchange_rate = exports.exchange_rate = (coin1, coin2) => {
  console.log(`Requesting current ${coin1}->${coin2} exchange rate...`)
  return new Promise( (resolve, reject) => {
    ShapeshiftClient.marketInfo(`${coin1}_${coin2}`, function (err, marketInfo) {
      if(err) {
        reject(err)
        return
      }
      resolve(marketInfo)
    })
  })
}

/**
 *  Ask ShapeShift for an exchange deposit address.
 *  @param  coin1 - Currency that will be deposited to ShapeShift
 *  @param  coin2 - Currency that will be withdrawn from ShapeShift
 */
exports.shift = (coin1, coin2, src_address, dest_address) => {
  return new Promise( (resolve, reject) => {
    console.log(`Requesting ${coin1}->${coin2} exchange deposit address from ShapeShift...`)
    let pair = `${coin1}_${coin2}`
    let options = {
      returnAddress: src_address
    }

    ShapeshiftClient.shift(dest_address, pair, options, function(err, response) {
      if(err) {
        reject(err)
        return
      }
      resolve(response)
    })
  })
}

/**
 *  Get a list of recent transactions.
 */
