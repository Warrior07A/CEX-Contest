import "dotenv/config";
import { createClient } from "redis";
import { env } from "./utils/env.js";
import { BALANCES, OrderBook, ORDERBOOKS, type CreateOrderInput, type RestingOrder } from "./store/exchange-store.js";

let balances  = {

}
let orderBook = {
  "BTC" : {
    ["asks"] : new Map<Number , RestingOrder>() , 
    ["bids"] : new Map<Number , RestingOrder>()
  },
  "SOL" : {
    ["asks"] : new Map<Number , RestingOrder>(), 
    ["bids"] :new Map<Number , RestingOrder>() 
  },
  "USD" : {
    ["asks"] : new Map<Number , RestingOrder>() ,
    ["bids"] : new Map<Number , RestingOrder>() 
  }
}
// xport interface RestingOrder {
//   orderId: string;
//   userId: string;
//   side: Side;
//   type: "limit";
//   symbol: string;
//   price: number;
//   qty: number;
//   filledQty: number;
//   status: OrderStatus;
//   createdAt: number;

orderBook.BTC.asks.set(90 , {
  orderId : "1232" ,
  userId : "12321" ,
})
// orderBook.set(
//   "BTC", {
//     "asks": {
//       90: {
//         orderId: 1,
//         userId: 1,
//         side: "sell",
//         type: "limit",
//         symbol: "BTC",
//         price: 90,
//         qty: 100,
//         filledQty: 10,
//         status: "partially_filled",
//         createdAt: Date.now()
//       },
//       88: {
//         orderId: 1,
//         userId: 1,
//         side: "sell",
//         type: "limit",
//         symbol: "BTC",
//         price: 90,
//         qty: 100,
//         filledQty: 10,
//         status: "partially_filled",
//         createdAt: Date.now()
//       },
//       80: {
//         orderId: 1,
//         userId: 1,
//         side: "sell",
//         type: "limit",
//         symbol: "BTC",
//         price: 90,
//         qty: 100,
//         filledQty: 10,
//         status: "partially_filled",
//         createdAt: Date.now()
//       },
//       "bids": {
//       }
//   },

// })

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

async function sendResponse(responseQueue: string, response: EngineResponse): Promise<void> {
  await responseClient.lPush(responseQueue, JSON.stringify(response));
}

function matchmakingBuy(orderId :string ,  userId : string , type : string , side: string, symbol : string, price: number, qty : number){

  let prices = Object.keys(orderBook[symbol]["asks"]);
  console.log(prices);

}
function handleEngineRequest(message: EngineRequest): unknown {
  /**
   * TODO(student):
   * 1. Check _message.type.
   * 2. Read _message.payload.
   * 3. Call your order book / balance / order logic.
   * 4. Return the data that should go back to the backend.
   *
   * Required message types:
   * - create_order
   * - get_depth
   * - get_user_balance
   * - get_order
   * - cancel_order
   */

  // just checking the flow, remove this when you start implementing the logic
  // 1. validate input + stock exists
  // 2. check + lock balance (INR for BUY, stock for SELL)
  // 3. run matching engine against opposite side of ORDERBOOK
  // 4. write fills to FILLS, update filledQty + status on ORDERS
  // 5. if leftover qty and LIMIT, rest on book; if MARKET, cancel remainder
  // 6. settle balances on each fill (move locked -> other asset's available)
  console.log(message);
  if (message.type === "create_order") {
    let { orderId ,  userId, type, side, symbol, price, qty } = message.payload;
    try {
      if (!balances.userId) {
        balances[userId] = {
          "BTC": {
            available: 1000,
            locked: 0
          },
          "SOL": {
            available: 1000,
            locked: 0
          },
          "USD": {
            available: 1000,
            locked: 0
          }
        };
      }
      /// balance check for the userrrr
      if (side == "buy") {
        console.log("came in buy");
        if (balances[userId][symbol]["available"] < (price * qty)) {
          return {
            msg: "INSUFFICIENT BALANCES",
            user_balance: balances.userId[symbol]["available"]
          }
        }
        
        console.log("sufficient balances available !!");

        balances[userId][symbol]["locked"] += (price * qty);
        balances[userId][symbol]["available"] -= (price * qty);

        // console.log(balances);
        console.log(orderBook);
        matchmakingBuy(orderId ,  userId, type, side, symbol, price, qty);
        console.log("match making done");


        return {
          "orderBook" : orderBook
        }
        if (type == "market") {
          let ArrayofPrices = orderBook.get(market)("asks").
            orderBook.get(market)
        }
        else {

        }


      }
      else {
        return {
          msg: "i came in sell"
        }
      }







      // return {
      //   orderId: crypto.randomUUID(),
      //   status: "filled",
      //   filledQty: DUMMY_SELL_ORDER.qty,
      //   averagePrice: DUMMY_SELL_ORDER.price,
      //   fills: [
      //     {
      //       fillId: crypto.randomUUID(),
      //       symbol: DUMMY_SELL_ORDER.symbol,
      //       price: DUMMY_SELL_ORDER.price,
      //       qty: DUMMY_SELL_ORDER.qty,
      //       buyOrderId: "request-buy-order",
      //       sellOrderId: DUMMY_SELL_ORDER.orderId,
      //     },
      //   ],
      //   note: "Smoke-test response only. Students must replace this with real matching logic.",
      // };
    }
    catch (e) {
      throw new Error(e.message);
    }
  }

  throw new Error("TODO(student): implement this engine request type");
}

console.log(`Engine listening on Redis queue: ${env.incomingQueue}`);

for (; ;) {
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