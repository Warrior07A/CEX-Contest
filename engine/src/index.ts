import "dotenv/config";
import { createClient } from "redis";
import { env } from "./utils/env.js";
import { MinHeap } from "./utils/minheap.js";
import { MaxHeap } from "./utils/maxheap.js";
import type { OrderRecord, walletType } from "./store/exchange-store.js";
import util from "util";
import { log } from "console";

let minheap = new MinHeap([]);
let maxheap = new MaxHeap([]);

let WALLET : walletType= {
  "USD" : {
    "7c2c182d-1c9f-41fd-8e7e-9dhdg6756efakshat" : {
      available: 100 ,
      locked: 100
    }
  },
  "BTC" : {

  } ,
  "SOL" : {

  },
  "ETH" :{
    
  }
}satisfies walletType

type StockDtype = {
  totalQty : number , 
  orders : OrderRecord[]
}
type TOffer = Record <("ASK" | "BIDS" ) , Map<number , StockDtype>>;

type TOrderBook = Record <string  , TOffer>;
let ORDERBOOK = {
  BTC : {
    ASK  : new Map<number , StockDtype>(), // price , [qty : [{} , {}, {}]];
    BIDS : new Map<number , StockDtype>()  
  },
  SOL :{
    ASK  : new Map<number , StockDtype>(), // price , [qty : [{} , {}, {}]];
    BIDS : new Map<number , StockDtype>()  
  }
}satisfies TOrderBook

export type EngineCommandType =
  | "create_order"
  | "get_depth"
  | "get_user_balance"
  | "get_order"
  | "cancel_order";

export interface EngineRequest {
  correlationId: string;
  responseQueue: string;
  type: EngineCommandType;
  payload: Record<string, unknown>;
}

export interface EngineResponse {
  correlationId: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

const brokerClient = createClient({ url: env.redisUrl }).on("error", (error) => {
  console.error("Redis broker client error", error);
});

const responseClient = createClient({ url: env.redisUrl }).on("error", (error) => {
  console.error("Redis response client error", error);
});

await Promise.all([brokerClient.connect(), responseClient.connect()]);

// :-)) I added this just to check the flow, remove it when you start
const DUMMY_SELL_ORDER = {
  orderId: "dummy-sell-order-1",
  userId: "dummy-seller",
  type: "limit",
  side: "sell",
  symbol: "BTC",
  price: 100,
  qty: 1,
  filledQty: 0,
  status: "open",
};

async function sendResponse(responseQueue: string, response: EngineResponse): Promise<void> {
  await responseClient.lPush(responseQueue, JSON.stringify(response));
}

function seedfund(userId : string , asset : string){
  WALLET[asset]![userId] = {
    "available" : 10000,
    "locked" : 0
  }
}

console.log(util.inspect(ORDERBOOK.BTC.ASK, { depth: null, colors: true }));
console.log(util.inspect(ORDERBOOK.BTC.BIDS, { depth: null, colors: true }));

function checkdata(responsse : any){
  console.log("hi");
  console.log(response);
}

function handleEngineRequest(message: EngineRequest): unknown {
  if (message.type === "create_order") {
    let fills = [];
    let payload = message.payload;
    let {orderId, type , side , symbol , qty , userId, price } = message.payload as {
      orderId : string , 
      type : string ,
      side : string ,
      symbol : string , 
      qty : number ,
      userId : string ,
      price : number 
    };
    let response = {
      orderId : orderId,
      userId : userId,
      price: price,
      qty : qty ,
      filledqty : 0,
      status: "partially filled"
    }
    // let oppoffer2 = (side == "sell" ? "ASK" : "BIDS");
    // ORDERBOOK[symbol]={
    //   "ASK" : new Map(),
    //   "BIDS" : new Map()
    // }
    // ORDERBOOK[symbol][oppoffer2].set(price , {
    //       totalQty : qty , 
    //       orders : [{
    //         orderId : orderId,
    //         userId : userId,
    //         price : price , 
    //         qty : qty
    //       }]
    //   })
    // console.log(ORDERBOOK);
    // ORDERBOOK[symbol][side].totalQty += qty;
    // console.log(util.inspect(ORDERBOOK , { depth: null, colors: true }));

    // checkdata(response);
    // return{
    //   msg : "no res"
    // };
    // if (payload.type == "limit"){
    
    //check for user balance

    let userasset = (side == "buy" ? WALLET["USD"]! : WALLET[symbol])!;
    if(!userasset[userId]){
      console.log("seeded data in wallet");
      seedfund(userId as string , side == "buy" ? "USD" : symbol);
    }
    let userBalance = userasset[userId]!;
    //wallet check
    if (userBalance["available"] < (price * qty)){
      return {
        msg : "not enough funds"
      }
    }
    userBalance["available"] -= price*qty;
    userBalance["locked"] += price*qty;
    
    let minask = (minheap.getmin() ?? -1);
    let maxask = (maxheap.getmax() ?? -1);

    while(qty > 0 && (side == "buy" ? (minheap.size() && (payload.type =="limit" ? (price >= minask) : 1)) : (maxheap.size() && (payload.type == "limit" ? price <= maxask : 1)) )){
      let currheap = (side == "buy" ? minheap : maxheap);
      let currask = (side == "buy" ? minask : maxask);
      let offer = (side == "buy" ? "ASK" : "BIDS");
      let currorders = ORDERBOOK[symbol][offer].get(currask);
      // console.log(util.inspect(ORDERBOOK[symbol][offer] , { depth: null, colors: true }));
      const totalQty = currorders.totalQty;
      let allOrders = currorders.orders

      if ((qty - totalQty) >=0 ){
        fills.push(allOrders)
        response.filledqty += totalQty;
        if (currheap == maxheap ?  currheap.removemax() : currheap.removemin());
        qty -= Number(totalQty);
        ORDERBOOK[symbol][offer].delete(currask);
        currask = (currheap == minheap ? currheap.getmin() : currheap.getmax());
        minask = minheap.getmin();
        maxask = maxheap.getmax();
        // console.log(minask); 
      }
      else{
        let firstOrder = allOrders[0];
          if ((qty - allOrders[0].qty) >= 0){
            fills.push(firstOrder);
            response.filledqty+= firstOrder.qty;
            let oid = firstOrder.orderId;
            let currask = (side == "buy" ? minask : maxask);
            ORDERBOOK[symbol][offer].get(currask).totalQty -= firstOrder.qty;
            qty -= allOrders[0].qty;                
            allOrders = allOrders.filter(order => order.orderId !== oid);
            ORDERBOOK[symbol][offer].get(currask)["orders"] = allOrders;
          }
          else{
            let oid = firstOrder.orderId;
            let filledqty = qty;
            response.filledqty +=qty;
            ORDERBOOK[symbol][offer].get(currask).totalQty -= qty;
            firstOrder.qty -= filledqty;
            fills.push({
              orderId : oid ,
              qty : filledqty,
              price : price,
              userId : userId
            })
            qty = 0;
          }
      }
      minask = minheap.getmin();
      maxask = maxheap.getmax();
    }
    let oppoffer = (side == "sell" ? "ASK" : "BIDS");
    let orderplaced = false;
    if(qty > 0){
      if (ORDERBOOK[symbol] && ORDERBOOK[symbol][oppoffer].get(price)){
        let order = ORDERBOOK[symbol][oppoffer].get(price);
        order.totalQty += qty;
        order.orders.push({
          orderId : orderId,
          userId : userId,
          price : price , 
          qty : qty
        })
      }
      else{
        if (!ORDERBOOK[symbol]){
          ORDERBOOK[symbol]={
            "ASK" : new Map<number , StockDtype>(),
            "BIDS" : new Map<number , StockDtype>()
          }

        }
        ORDERBOOK[symbol][oppoffer].set(price , {
          totalQty : qty , 
          orders : [{
            orderId : orderId,
            userId : userId,
            price : price , 
            qty : qty
          }]
        })
        console.log(ORDERBOOK);
        if (oppoffer == "ASK") minheap.insert(price);
        else maxheap.insert(price);
      }
      orderplaced = true;
    }
    console.log(util.inspect(ORDERBOOK ,{ depth: null, colors: true }));
    console.log(util.inspect(ORDERBOOK , { depth: null, colors: true }));
    console.log(WALLET);
    console.log("THE END");
    if (response.qty == response.filledqty) response["status"] = "filled";
    if (response.filledqty ==0) response["status"] = "open"
    if (orderplaced) return {
        msg : "your order has been placed",
        res : response,
        fills : fills
    }
    return {
      res : response,
      fills : fills
    }
    // }
  }

  throw new Error("TODO(student): implement this engine request type");
}

console.log(`Engine listening on Redis queue: ${env.incomingQueue}`);

for (;;) {
  const item = await brokerClient.brPop(env.incomingQueue, 0);
  if (!item) continue;

  let message: EngineRequest;

  try {
    message = JSON.parse(item.element) as EngineRequest;
  } catch {
    console.error("Skipping invalid broker message");
    continue;
  }

  try {
    const data = handleEngineRequest(message);
    await sendResponse(message.responseQueue, {
      correlationId: message.correlationId,
      ok: true,
      data,
    });
  } catch (error) {
    await sendResponse(message.responseQueue, {
      correlationId: message.correlationId,
      ok: false,
      error: error instanceof Error ? error.message : "engine_error",
    });
  }
}