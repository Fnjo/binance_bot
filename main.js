const binance = require('node-binance-api');
var readline = require('readline-sync');
var fs = require('fs');

binance.options({
  APIKEY: '',
  APISECRET: '',
  useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
  // test: true // If you want to use sandbox mode where orders are simulated
});

let price = 0;
let change = 0;
let quantity = 0;
let basePrice = 0;
let neoPrice = 0;
let neoPriceNow = 0;
let neoPriceBefore = 0;
let sellPrice = 0;
let stopPrice = 0;
let buyPrice = 0;
let neoBalance = 4;
let usdtBalance = 0;
let btcBalance = 0;
let Balance1 = 0;
let Balance2 = 0;
let balance1BTC = 0;
let count = 0;
let nameCheck = "i";
let nameCheckNew = "i";
let tradeAmount = -1;
let orders = 0;
let type = "STOP_LOSS_LIMIT";
let oldBalance = 0;
let oldBalance1 = 0;
let oldBalance2 = 0;
let singleOrders = 0;
let checkOrdersCount = 0;
let checkOrdersCount2 = 0;
let coin1min = 0;
let coin2min = 0;

let timeInSec = new Date().getTime();
let gains = 0;
let loss = 0;
let rs = 0;
let rsi = 0;

// getNEO = () => {
// 	return new Promise(resolve => {
// 		binance.websockets.candlesticks(['NEOUSDT'], "1m", (candlesticks) => {
// 			let { e:eventType, E:eventTime, s:symbol, k:ticks } = candlesticks;
// 			let { o:open, h:high, l:low, c:close, v:volume, n:trades, i:interval, x:isFinal, q:quoteVolume, V:buyVolume, Q:quoteBuyVolume } = ticks;
// 			price = close
// 			resolve(price)
// 		})
// 	})
// }

sleep = (x) => {
	return new Promise(resolve => {
		setTimeout(() => { resolve(true) }, x )
	});
}

function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    // console.log(" "+year + "/" + month + "/" + day)
    // console.log(" "+hour + ":" + min + ":" + sec)

    return year + "/" + month + "/" + day + "\n " + hour + ":" + min + ":" + sec;
}


coin = (pair) => {
	return new Promise(resolve => {
    binance.prices(pair, (error, ticker) => {
      if(error){
          console.log(" Errored on getting coin price")
          singlePair(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal)
      }else{
	       price = ticker[pair]
	        resolve(price)
      }
		})
	})
}

checkRSI = (pair) => {
	return new Promise(resolve => {
    binance.candlesticks(pair, "5m", (error, ticks, symbol) => {
      //let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume] = last_tick;
      for (let i=0; i<ticks.length-1;i++){
        change = parseFloat(ticks[i+1][1]) - parseFloat(ticks[i][1])
        // console.log(change);
        if(change>0){
          gains = gains+change
        }else{
          change = change * -1
          loss = loss+change
        }
      }
      rs = ((gains/14)/(loss/14))+1
      rsi = 100 - (100/rs)
      resolve(rsi)
		}, {limit: 14, endTime: timeInSec});
	})
}

allOrders = () => {
	return new Promise(resolve => {
    binance.openOrders(false, (error, openOrders) => {
      resolve(openOrders)
		})
	})
}

allCoins = () => {
	return new Promise(resolve => {
    binance.prices((error, ticker) => {
			resolve(ticker)
		})
	})
}
// +164 rate limit
balances = (x) => {
	return new Promise(resolve => {
    binance.balance((error, balances) => {
      if (error) {
				console.log( error )
				resolve([])
			} else {
        resolve(balances[x].available)
      }
		})
	})
}

multiBalances = (x, x2) => {
	return new Promise(resolve => {
    binance.balance((error, balances) => {

        balance1 = (balances[x].available)
        console.log("1+" + Balance1)
        resolve(balance1)

        balance2 = (balances[x2].available)
        console.log("2+" + Balance2)
        resolve(balance2)

		})
	})
}

async function checkOrders(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal){
  checkOrdersCount = checkOrdersCount + 1
  await sleep(4000)
  orders = await getOrders(pair)
  await sleep(4000)
  if (orders.length >= 1 && checkOrdersCount >= 7){
    checkOrdersCount2 = 1;
  } else if(orders.length >= 1){
    console.log(' Checking orders')
    console.log(await coin(pair))
    await checkOrders(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal)
  } else{
    console.log(" All orders are filled!")
    console.log('------------------------------')
  }
}

getOrders = (pair) => {
	return new Promise(resolve => {
    binance.openOrders(pair, (error, openOrders, symbol) => {
      resolve(openOrders)
		})
	})
}

async function compareBalances(x, xpair){
  if (oldBalance != x){
    console.log(" Comparing balances")
    x = await balances(xpair);
    console.log(" xpair = "+xpair)
    console.log(" oldBalance = "+oldBalance)
    console.log(x)
    await sleep(9000)
    await compareBalances(x, xpair)
  }else{
    console.log(" Balances compared and checked!")
  }
}

async function getPair(x, baseCoin){
  for(var i = 0; i < (Object.keys(x).length); i++){
    pairBase = (Object.keys(x)[i]).slice(-3);
    if(pairBase == baseCoin){
      var deletePair = (Object.keys(x)[i])
      allPricesBeforeBTC[deletePair] = Object.values(x)[i]
    }
  }
}

async function checkRSI(pair){
  binance.candlesticks(pair, "5m", (error, ticks, symbol) => {

    //let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume] = last_tick;

    for (let i=0; i<ticks.length-1;i++){
      change = parseFloat(ticks[i+1][1]) - parseFloat(ticks[i][1])
      console.log(change);
      if(change>0){
        gains = gains+change
      }else{
        change = change * -1
        loss = loss+change
      }
    }
    rs = ((gains)/(loss))+1
    rsi = 100 - (100/rs)
    console.log(rsi)
  }, {limit: 14, endTime: timeInSec});
}


async function checkBalances(x, x2, pair1, pair2, pair){
  await sleep(1000)
  console.log("checkBalances 1")
  balances1 = await balances(pair1)
  await sleep(1000)
  console.log("checkBalances 2")
  balances2 = await balances(pair2)
  await sleep(500)
  balance1BTC = balance1 * (await coin(pair))

  await sleep(500)
  console.log("checkBalances 3")
  await sleep(200)
  console.log(" 1 = "+balance1)
  console.log(" 1BTC = "+balance1BTC)
  console.log(" 2 = "+balance2)
  console.log(" "+x+" needs to be bigger than "+x2)

  if(x >= x2){
    console.log(" Orders filled and balances checked")
  }else{
    await checkBalances(x, x2, pair1, pair2, pair)
  }
}

async function startupCheck(x, x2, pair1, pair2){
  if(balance1 >= x || balance2 >= x2){
    console.log(" Balances filled!")
    console.log(" "+pair1+" = "+balance1)
    console.log(" "+pair2+" = "+balance2)
    await sleep(9000)
  }else{
    console.log(" Balances not filled yet!")
    await sleep(18000)
    balance1 = await balances(pair1)
    balance2 = await balances(pair2)
    await startupCheck(x, x2, pair1, pair2)
  }
}

async function checkToSell(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal){
  await sleep(240000)
  console.log(" "+await getDateTime())
  console.log(" Trades: " + tradeAmount)
  balance1 = await balances(pair1)
  neoPriceNow = await coin(pair)
  neoPriceNow = parseFloat(neoPriceNow).toFixed(priceDecimal)
  balance1 = await balances(pair1)
  balance2 = await balances(pair2)
  console.log(" "+neoPriceNow)
  console.log(" Change when higher: "+ (neoPriceBefore * higher).toFixed(priceDecimal))
  console.log(" Sell at: "+ sellPrice)
  console.log(" Change: "+(((neoPriceNow/neoPriceBefore)*100)-100).toFixed(2) + "%")

  console.log(" "+ pair1 +": " + balance1)
  console.log(" "+ pair2 +": " + balance2)
  console.log('------------------------------')

  if (neoPriceNow > (neoPriceBefore * higher).toFixed(priceDecimal)){
    //pas stop loss aan
    console.log(" "+((neoPriceNow/neoPriceBefore-1)*100).toFixed(2) + " %")
    sellPrice = parseFloat(neoPriceNow * sell).toFixed(priceDecimal)
    neoPriceBefore = parseFloat(neoPriceNow).toFixed(priceDecimal)
    await sleep(200)
    console.log(" Price: " + neoPriceNow)
    console.log(" Sellprijs aangepast: " + sellPrice)
    // await sleep(500)
    // binance.cancelOrders(pair, (error, response, symbol) => {
    //   console.log(symbol+" cancel response:", response);
    // })
    await sleep(200)
    //await startupCheck(coin1min, coin2min, pair1, pair2)
    //await sleep(500)
    balance1 = await balances(pair1)
    await sleep(200)

    // no decimals
    //quantity = Math.floor(balance1)

    // 2 decimals
    //quantity = Math.floor(balance1*100)/100

    //custom decimals
    quantity = Math.floor(balance1*quantityDecimal)/quantityDecimal

    console.log(quantity + "+1")
    await sleep(500)
    console.log('------------------------------')
    //stopPrice = parseFloat(sellPrice*0.99).toFixed(priceDecimal)
    console.log(" Quantity: "+quantity)
    console.log(" Sellprice: "+sellPrice)
    // console.log(" Stopprice: "+stopPrice)
    // await sleep(200)
    //
    // binance.sell(pair, quantity, sellPrice, {stopPrice: stopPrice, type: type}, function(error, response) {
    //    if ( error ) return console.error(error);
    //     console.log(response);
    //     console.log('------------------------------')
    // })
    await sleep(200)
    console.log('------------------------------------------------------------------------------------------')
    await checkToSell(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal)
  } else if(neoPriceNow < sellPrice){
    //sell
    await sleep(100)
    checkOrdersCount = 0;
    checkOrdersCount2 = 0;
    // await sleep(100)
    //await checkOrders(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal)

    // if(checkOrdersCount2 == 1){
    //   neoPriceNow = await coin(pair)
    //   if(neoPriceNow > (sellPrice * 0.994) && neoPriceNow < sellPrice){
    //     console.log(" Orders not hit, executing market order")
    //     await sleep(1000)
    //     binance.cancelOrders(pair, (error, response, symbol) => {
    //       console.log(symbol+" cancel response:", response);
    //     })
    //     await sleep(1000)
    //     console.log(" Cleared all orders")
    //     await sleep(1000)
    //     balance1 = await balances(pair1)
    //     balance2 = await balances(pair2)
    //     //minimal values both should have if filled
    //     await startupCheck(coin1min, coin2min, pair1, pair2)
    //     await sleep(500)
    //     binance.marketSell(pair, quantity);
    //   }else{
    //     console.log(" Price: "+neoPriceNow)
    //     console.log(" Sell price down: "+sellPrice)
    //     console.log(" Sell price up: "+sellPrice*0.994)
    //     tradeAmount = tradeAmount - 1
    //   }
    // }
    binance.marketSell(pair, quantity);
    console.log('------------------------------------------------------------------------------------------')
    balance2 = await balances(pair2)
    await sleep(9000)
    while(balance2 < (oldBalance2*0.6)){
      await sleep(9000)
      balance2 = await balances(pair2)
    }
    await sleep(100)

    fs.appendFileSync("singlePairLog.txt", '\n' + getDateTime() + '\n' + 'Pair: '+ pair + '\n' + 'Sold for: '+ sellPrice + + '\n' + 'Quantity: '+ quantity + '\n' , "UTF-8",{'flags': 'a+'});

    await singlePair(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal);
  } else {
    await checkToSell(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal)
  }
}

async function checkToSell2(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal, priceDecimal){
  await sleep(5000)
  getDateTime()
  neoPriceNow = await coin(pair)
  neoPriceNow = parseFloat(neoPriceNow).toFixed(priceDecimal)
  console.log(" "+neoPriceNow)
  console.log(" Higher than: "+ (neoPriceBefore * higher).toFixed(priceDecimal))
  console.log(" Sell at: "+ sellPrice)
  console.log(" Change: "+((neoPriceNow/neoPriceBefore-1)*100).toFixed(2) + "%")
  console.log('------------------------------')

  if (neoPriceNow > (neoPriceBefore * higher).toFixed(8)){
    //pas stop loss aan
    console.log(" "+((neoPriceNow/neoPriceBefore-1)*100).toFixed(2) + " %")
    sellPrice = parseFloat(neoPriceNow * sell).toFixed(priceDecimal)
    neoPriceBefore = parseFloat(neoPriceNow).toFixed(priceDecimal)
    console.log(" Price: " + neoPriceNow)
    console.log(" Sellprijs aangepast: " + sellPrice)
    console.log('------------------------------------------------------------------------------------------')
    checkToSell2(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal)
  } else if(neoPriceNow < sellPrice){
    //sell
    Balance2 = Balance1 * sellPrice
    Balance1 = 0
    console.log(" sold for: " + sellPrice)
    console.log('------------------------------------------------------------------------------------------')
  } else {
    checkToSell2(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal)
  }
}

async function checkToBuy(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal){
  await sleep(240000)
  console.log(" "+await getDateTime())
  console.log(" Trades: " + tradeAmount)
  neoPriceNow = await coin(pair)
  neoPriceNow = parseFloat(neoPriceNow).toFixed(priceDecimal)
  balance1 = await balances(pair1)
  balance2 = await balances(pair2)
  console.log(" "+neoPriceNow)
  console.log(" Change if lower: "+ (basePrice * setBase).toFixed(priceDecimal))
  console.log(" Buy at: "+ (basePrice * setBuy).toFixed(priceDecimal))
  console.log(" Change: "+(((neoPriceNow/neoPriceBefore)*100)-100).toFixed(2) + "%")
  console.log(" "+ pair1 +": " + balance1)
  console.log(" "+ pair2 +": " + balance2)

  console.log('------------------------------')
  if (neoPriceNow < (basePrice * setBase).toFixed(priceDecimal)){
    basePrice = parseFloat(neoPriceNow).toFixed(priceDecimal)
    buyPrice = parseFloat(basePrice * setBuy).toFixed(priceDecimal)
    neoPriceBefore = basePrice
    await sleep(200)
    // binance.cancelOrders(pair, (error, response, symbol) => {
    //   console.log(symbol+" cancel response:", response);
    // })
    // await sleep(5000)
    console.log('------------------------------')
    // balance2 = await balances(pair2)
    // await sleep(1000)
    //await startupCheck(coin1min, coin2min, pair1, pair2)
    console.log(balance2)
    console.log(buyPrice)
    await sleep(200)
    balance2 = await balances(pair2)
    await sleep(200)
    // no decimals
    //quantity = Math.floor(balance2/buyPrice)

    // 2 decimals
    // quantity = Math.floor((balance2/buyPrice)*100)/100

    //custom decimals
    quantity = Math.floor((balance2/buyPrice)*quantityDecimal)/quantityDecimal


    await sleep(500)
    console.log(quantity + "+3")
    //stopPrice = parseFloat(buyPrice*1.01).toFixed(priceDecimal)
    console.log(" Quantity: "+quantity)
    console.log(" Buyprice: "+buyPrice)
    //console.log(" Stopprice: "+stopPrice)
    await sleep(200)
    // binance.buy(pair, quantity, buyPrice, {stopPrice: stopPrice, type: type}, function(error, response) {
    //    if ( error ) return console.error(error);
    //     console.log(response);
    //     console.log('------------------------------')
    // })
    // await sleep(200)
    console.log('------------------------------')
    console.log(' BuyPrice changed to ' + buyPrice)
    console.log('------------------------------------------------------------------------------------------')
    await checkToBuy(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal);
  } else if(neoPriceNow > (basePrice * setBuy).toFixed(priceDecimal)) {
    checkOrdersCount = 0;
    checkOrdersCount2 = 0;
    await sleep(100)
    //await checkOrders(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal)

    // if(checkOrdersCount2 == 1){
    //   neoPriceNow = await coin(pair)
    //   if(neoPriceNow < (buyPrice * 1.006) && neoPriceNow > buyPrice){
    //     console.log(" Orders not hit, executing market order")
    //     await sleep(1000)
    //     binance.cancelOrders(pair, (error, response, symbol) => {
    //       console.log(symbol+" cancel response:", response);
    //     })
    //     await sleep(1000)
    //     console.log(" Cleared all orders")
    //     await sleep(1000)
    //     quantity = quantity - 10
    //     balance1 = await balances(pair1)
    //     balance2 = await balances(pair2)
    //     //minimal values both should have if filled
    //     await startupCheck(coin1min, coin2min, pair1, pair2)
    //     await sleep(500)
    //     binance.marketBuy(pair, quantity);
    //   }else{
    //     console.log(" Price: "+neoPriceNow)
    //     console.log(" Sell price down: "+buyPrice*1.006)
    //     console.log(" Sell price up: "+buyPrice)
    //     tradeAmount = tradeAmount - 1
    //   }
    // }
    quantity = parseFloat(quantity*0.98).toFixed(5)

    binance.marketBuy(pair, quantity);
    console.log('------------------------------------------------------------------------------------------')
    await sleep(100)
    balance1 = await balances(pair1)
    await sleep(9000)
    while(balance1 < (oldBalance1*0.6)){
      await sleep(9000)
      console.log(" Checking balances")
      balance1 = await balances(pair1)
    }
    await sleep(100)
    fs.appendFileSync("singlePairLog.txt", '\n' + getDateTime() + '\n' + 'Pair: '+ pair + '\n' + 'Bought for: '+ buyPrice + '\n' + 'Quantity: '+ quantity + '\n' , "UTF-8",{'flags': 'a+'});

    await singlePair(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal);
  } else {
    await checkToBuy(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal)
  }
}

async function singlePair(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal) {
  orders = await getOrders(pair)
  await sleep(1000)
  console.log(" Open orders: " + orders.length)

  await sleep(1000)
  binance.cancelOrders(pair, (error, response, symbol) => {
    console.log(symbol+" cancel response:", response);
  })
  await sleep(1000)
  console.log(" Cleared all orders")

  await sleep(100)
  balance1 = await balances(pair1)
  balance2 = await balances(pair2)

  //minimal values both should have if filled
  await startupCheck(coin1min, coin2min, pair1, pair2)
  tradeAmount = tradeAmount + 1
  console.log('------------------------------------------------------------------------------------------')
  console.log(" "+ await getDateTime())
  console.log('------------------------------')
  console.log(" Trades: " + tradeAmount)
  console.log('------------------------------')
  balance1 = await balances(pair1)
  balance2 = await balances(pair2)
  console.log(" "+ pair1 +": " + balance1)
  console.log(" "+ pair2 +": " + balance2)
	console.log('------------------------------')
  neoPrice = await coin(pair)
  neoPrice = parseFloat(neoPrice).toFixed(priceDecimal)
  console.log(" "+ pair1 +": " + neoPrice)
  console.log('------------------------------')

  fs.appendFileSync("singlePairLog.txt", '\n' + 'Pair 1: '+ balance1 + '\n' + 'Pair 2: '+ balance2 + '\n', "UTF-8",{'flags': 'a+'});

  if((balance1 * neoPrice) > balance2){
    //Meer NEO, sell
    console.log(' Selling '+ pair1 +": ")
    console.log('------------------------------')
    oldBalance = balance1
    oldBalance1 = balance1
    oldBalance2 = balance2
    neoPriceBefore = await coin(pair)
    neoPriceBefore = parseFloat(neoPriceBefore).toFixed(priceDecimal)
    //no decimals
    //quantity = Math.floor(balance1)

    // 2 decimals
    //quantity = Math.floor(balance1 * 100)/100

    //custom decimals
    quantity = Math.floor(balance1*quantityDecimal)/quantityDecimal

    console.log(quantity+"+4")
    sellPrice = parseFloat(neoPriceBefore * sell).toFixed(priceDecimal)
    stopPrice = parseFloat(sellPrice*0.99).toFixed(priceDecimal)
    console.log(" Quantity: "+quantity)
    console.log(" Sellprice: "+sellPrice)
    // console.log(" Stopprice: "+stopPrice)
    // await sleep(500)
    // binance.sell(pair, quantity, sellPrice, {stopPrice: stopPrice, type: 'STOP_LOSS_LIMIT'}, function(error, response) {
    //    if ( error ) return console.error(error);
    //     console.log(response);
    //     console.log('------------------------------')
    // })
    await sleep(500)
    // console.log(' Sell price: ' + sellPrice)
    console.log('------------------------------')

    await checkToSell(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal)
  }else{
    //Meer USDT, buy
    console.log(' Wachten om '+ pair1 +' te kopen')
    console.log('------------------------------')
    oldBalance = balance2
    oldBalance1 = balance1
    oldBalance2 = balance2
    neoPriceBefore = await coin(pair)
    basePrice = neoPriceBefore
    buyPrice = parseFloat(basePrice * setBuy).toFixed(priceDecimal)
    console.log(' Buy price: ' + buyPrice)
    console.log('------------------------------')
    await sleep(1000)
    console.log(balance2)
    console.log(buyPrice)
    // no decimals
    //quantity = Math.floor(balance2/buyPrice)

    // 2 decimals
    //quantity = Math.floor((balance2/buyPrice) * 100)/100

    //custom decimals
    quantity = Math.floor((balance2/buyPrice)*quantityDecimal)/quantityDecimal

    console.log(quantity + "+2")
    stopPrice = parseFloat(buyPrice*1.01).toFixed(priceDecimal)
    await sleep(100)
    console.log(" Quantity: "+quantity)
    console.log(" Buyprice: "+buyPrice)
    //console.log(" Stopprice: "+stopPrice)
    // binance.buy(pair, quantity, buyPrice, {stopPrice: stopPrice, type: type}, function(error, response) {
    //    if ( error ) return console.error(error);
    //     console.log(response);
    //     console.log('------------------------------')
    // })
    await sleep(500)
    console.log('------------------------------')

    await checkToBuy(pair1, pair2 ,pair, higher, sell, setBase, setBuy, priceDecimal)
  }
}

async function checkAll(){

  let allPrices = [];
  let allPricesBefore = [];
  let allPricesBeforeBTC = [];
  let allPricesNow = [];
  let allPricesNowBTC = [];
  let highChanges = [];
  let highValues = [];
  let highestChange = [];

  allPricesBefore = await allCoins()

  for(var i = 0; i < (Object.keys(allPricesBefore).length); i++){
    pairBase = (Object.keys(allPricesBefore)[i]).slice(-3);
    if(pairBase == 'BTC'){
      var deletePair = (Object.keys(allPricesBefore)[i])
      allPricesBeforeBTC[deletePair] = Object.values(allPricesBefore)[i]
    }
  }

  await sleep(7000)

  allPricesNow = await allCoins()

  for(var i = 0; i < (Object.keys(allPricesNow).length); i++){
    pairBase = (Object.keys(allPricesNow)[i]).slice(-3);
    if(pairBase == 'BTC'){
      var deletePair = (Object.keys(allPricesNow)[i])
      allPricesNowBTC[deletePair] = Object.values(allPricesNow)[i]
    }
  }

  for(var i = 0; i < Object.keys(allPricesBeforeBTC).length; i++){
    change = (((Object.values(allPricesNowBTC)[i] / Object.values(allPricesBeforeBTC)[i]-1)*100))
    if (change > 0){
      highChanges.push(i, change)
      highValues.push(change)
    }
  }

  let arr = Object.values(highValues);
  let max = Math.max(...arr);

  for(var i = 1; i < Object.keys(highChanges).length; i+=2){
    if ((Object.values(highChanges)[i]) == max){
      highestChange = [Object.values(highChanges)[i-1], max]
    }
  }


  await sleep(100)
  console.log( await count)
  console.log(Object.keys(allPricesNowBTC)[Object.values(highestChange)[0]])
  console.log(max.toFixed(2))
  if(nameCheck != Object.keys(allPricesNowBTC)[Object.values(highestChange)[0]]){
    count = 0
    console.log("Count reset!")
  }
  if (count == 0){
    // count naar 1 & set new nameCheck
    count = count + 1
    nameCheck = Object.keys(allPricesNowBTC)[Object.values(highestChange)[0]]
  } else if(count == 1){
    //count naar 2
    count = count + 1

  } else if (count == 2){

    price = await coin(Object.keys(allPricesNowBTC)[Object.values(highestChange)[0]])
    var pumpcoin = Object.keys(allPricesNowBTC)[Object.values(highestChange)[0]]
    pumpcoin = pumpcoin.slice(0, -3)
    var pumpPair = pumpcoin + "BTC"
    Balance1 = Balance2 * price
    Balance2 = 0

    console.log("--------------------------------------------")
    console.log(" "+ await getDateTime())
    console.log(" "+ max)
    console.log(" "+ Object.keys(allPricesNowBTC)[Object.values(highestChange)[0]])
    console.log("--------------------------------------------")
    console.log(" "+ Object.keys(allPricesNowBTC)[Object.values(highestChange)[0]]+": "+ Balance2)
    console.log(" BTC: "+Balance2)

    await sleep(100)
    //fs.appendFileSync("pump.txt", '\n' + getDateTime() + '\n' + max + '\n' +Object.keys(allPricesNowBTC)[Object.values(highestChange)[0]]+ '\n' + price + '\n' +, "UTF-8",{'flags': 'a+'});

    //checkToSell2(pumpcoin, 'BTC', pumpPair, 1.001, 0.995, 0.999, 1.005)
  }
  checkAll()
}

async function RSI_sell() {
  console.log('------------------------------')
  console.log(" Selling");
  console.log(" "+await getDateTime())
  console.log(" Trades: " + tradeAmount)
  neoPriceNow = await coin(pair)
  neoPriceNow = parseFloat(neoPriceNow).toFixed(priceDecimal)
  balance1 = await balances(pair1)
  balance2 = await balances(pair2)
  await sleep(300)
  await checkRSI(pair)
  await sleep(300)
  console.log(" RSI: "+rsi);
  console.log(" Price: "+neoPriceNow)
  console.log(" "+ pair1 +": " + balance1)
  console.log(" "+ pair2 +": " + balance2)
  console.log('------------------------------')
  if(rsi >= 60){
    quantity = Math.floor(balance1*quantityDecimal)/quantityDecimal
    await sleep(200)
    binance.marketSell(pair, quantity);
    await sleep(1000)
    fs.appendFileSync("RSI_LOG.txt", '\n' + getDateTime() + '\n' + 'Pair: '+ pair + '\n' + 'Sold for: '+ neoPriceNow + '\n' + 'Quantity: '+ quantity + '\n' , "UTF-8",{'flags': 'a+'});
    await rsiFormula()
  }else{
    await sleep(300000)
    await RSI_sell()
  }
}

async function RSI_buy() {
  console.log('------------------------------')
  console.log(" Buying");
  console.log(" "+await getDateTime())
  console.log(" Trades: " + tradeAmount)
  neoPriceNow = await coin(pair)
  neoPriceNow = parseFloat(neoPriceNow).toFixed(priceDecimal)
  balance1 = await balances(pair1)
  balance2 = await balances(pair2)
  await sleep(300)
  await checkRSI(pair)
  await sleep(300)
  console.log(" RSI: "+rsi);
  console.log(" Price: "+neoPriceNow)
  console.log(" "+ pair1 +": " + balance1)
  console.log(" "+ pair2 +": " + balance2)
  console.log('------------------------------')
  if(rsi <= 30){
    quantity = Math.floor((balance2/neoPriceNow)*quantityDecimal)/quantityDecimal
    await sleep(200)
    quantity = parseFloat(quantity*0.985).toFixed(5)
    await sleep(200)
    binance.marketBuy(pair, quantity);
    await sleep(1000)
    fs.appendFileSync("RSI_LOG.txt", '\n' + getDateTime() + '\n' + 'Pair: '+ pair + '\n' + 'Bought for: '+ neoPriceNow + '\n' + 'Quantity: '+ quantity + '\n' , "UTF-8",{'flags': 'a+'});
    await rsiFormula()
  }else{
    await sleep(300000)
    await RSI_buy()
  }
}

async function rsiFormula(){
  await sleep(1000)
  balance1 = await balances(pair1)
  balance2 = await balances(pair2)
  //minimal values both should have if filled
  await startupCheck(coin1min, coin2min, pair1, pair2)
  tradeAmount = tradeAmount + 1
  neoPrice = await coin(pair)
  neoPrice = parseFloat(neoPrice).toFixed(priceDecimal)
  if((balance1 * neoPrice) > balance2){
    await RSI_sell()
  }else{
    await RSI_buy()
  }
}

var whichFunction = readline.question("What do you want to do? / singlePair(1) / rsi(2) / checkAll: ");

if (whichFunction == "singlePair" || whichFunction == "1"){
  console.log('---------------- Running singlePair function -----------------')
  var pair_1 = readline.question(" Coin 1: ");
  coin1min = readline.question(" Coin 1 min amount: ");
  var pair_2 = readline.question(" Coin 2: ");
  coin2min = readline.question(" Coin 2 min amount: ");
  var pair = pair_1 + pair_2
  var defaultrates = readline.question(" Set rates (default/custom): ");
  if(defaultrates == "default" || defaultrates == "1"){
    var higher = 1.001
    var sell = 0.995
    var setBase = 0.999
    var setBuy = 1.007
    var priceDecimal = 3
    var quantityDecimal = 100000 //100 = 2 decimals, 100000 = 5 decimals
  }else{
    var higher = readline.question(" Change sell price percentage at: ");
    var sell = readline.question(" Set sell price percentage to: ");
    var setBase = readline.question(" Change baseprice percentage at: ");
    var setBuy = readline.question(" Set buyprice percentage to: ");
    var priceDecimal = readline.question(" Set price decimals to: ")
  }
  singlePair(pair_1, pair_2 ,pair, higher, sell, setBase, setBuy, priceDecimal)
} else if (whichFunction == "rsi" || whichFunction == "2"){
  console.log('---------------- Running RSI function -----------------')
  var pair1 = readline.question(" Coin 1: ");
  coin1min = readline.question(" Coin 1 min amount: ");
  var pair2 = readline.question(" Coin 2: ");
  coin2min = readline.question(" Coin 2 min amount: ");
  var pair = pair1 + pair2
  var priceDecimal = 3
  var quantityDecimal = 100000 //100 = 2 decimals, 100000 = 5 decimals
  rsiFormula()
}

// Params:
// - Pair 1
// - Pair 2
// - Trading pair eg. NEOUSDT, ETHBTC etc etc..
// - Change sell price percentage when
// - Set sell price percentage to
// - Change baseprice percentage when
// - Set buyprice percentage to



// singlePair('TRX', 'BTC', 'TRXBTC', 1.001, 0.995, 0.999, 1.005)
