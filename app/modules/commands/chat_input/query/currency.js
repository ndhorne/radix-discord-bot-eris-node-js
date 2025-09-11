/*
Copyright (C) 2022, 2023 Nicholas D. Horne

This file is part of Radix Discord Bot.

Radix Discord Bot is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Radix Discord Bot is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Radix Discord Bot.  If not, see <https://www.gnu.org/licenses/>.
*/
"use strict";

//const request = require("request"); //deprecated

const getHelp = require("../help.js");

const { logMessage, logException } = require("../../../helpers/loggers.js");

async function getExchangeRate(msg, args) {
  if (
    args.length === 0
    || typeof args[0] !== "string"
    || !/^[a-zA-Z]+$/.test(args[0])
  ) {
    return await getHelp(msg, ["query", "currency"]);
  }
  
  const from = args[0].toUpperCase();
  const to = (
    (
      typeof args[1] === "string" && /^[a-zA-Z]+$/.test(args[1])
      ? args[1]
      : "USD"
    ).toUpperCase()
  );
  const url = `https://api.coinbase.com/v2/exchange-rates?currency=${from}`
  
  /* npm request package (deprecated)
  //options parameter object value
  const options = {
    url: url,
    method: "GET"
  };
  
  request(options, function(err, res, body) {
    try {
      if (err) throw err;
      if (!err && res.statusCode == 200) {
        const result = JSON.parse(body);
        const data = result.data.rates[`${to}`];
        
        return `1 ${from} = ${(+data).toFixed(2)}${to}`;
      } else {
        logMessage(`Error connecting to ${url}`)
        return await getHelp(msg, ["query", "currency"]);
      }
    } catch (err) {
      logException(err);
    }
  });
  */
  
  try {
    const response = await fetch(url);
    if (response.ok) {
      const result = await response.json();
      const data = result.data.rates[`${to}`];
      
      return `1 ${from} = ${(+data).toFixed(2)}${to}`;
    } else {
      logMessage(`Error connecting to ${url}`)
      return await getHelp(msg, ["query", "currency"]);
    }
  } catch (err) {
    logException(err);
  }
}

module.exports = getExchangeRate;
