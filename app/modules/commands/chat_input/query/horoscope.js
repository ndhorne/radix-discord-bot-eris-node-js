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

const HTMLParser = require("node-html-parser"); //for scraping horoscope.com

//const request = require("request"); //deprecated

const getHelp = require("../help.js");

const { logMessage, logException } = require("../../../helpers/loggers.js");

async function getHoroscope(msg, args) {
  if (args.length === 0 || typeof args[0] !== "string") {
    return await getHelp(msg, ["query", "horoscope"]);
  }
  
  const signs = [
    "aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio",
    "sagittarius", "capricorn", "aquarius", "pisces"
  ];
  const sign = args[0].toLowerCase();
  
  if (!signs.includes(sign)) {
    return await getHelp(msg, ["query", "horoscope"]);
  }
  
  //horoscope.com
  const url = "https://www.horoscope.com/us/horoscopes/general/horoscope-general-daily-today.aspx?sign="
    + (signs.indexOf(sign) + 1)
  ;
  
  try {
    const response = await fetch(url);
    
    if (response.ok) {
      const body = await response.text();
      const parsed = HTMLParser.parse(body);
      const element = parsed.querySelector("p");
      const content = element.childNodes[1]._rawText.slice(3);
      
      return content;
    } else {
      logMessage(`Error connecting to ${url}`);
    }
  } catch (err) {
    logException(err);
  }
  
  /* aztro
  const url = `https://aztro.sameerkumar.website/?sign=${sign}&day=today`;
  
  try {
    const response = await fetch(url, {method: "POST"});
    
    if (response.ok) {
      const result = await response.json();
      
      return result.description;
    } else {
      logMessage(`Error connecting to ${url}`);
    }
  } catch (err) {
    logException(err);
  }
  */
  
  /* options parameter object value for npm request package (deprecated)
  const options = {
    url: url,
    method: "POST"
  };
  */
  
  /* npm request package (deprecated)
  request(options, function(err, res, body) {
    try {
      if (err) throw err;
      if (!err && res.statusCode == 200) {
        const result = JSON.parse(body);
        
        return result.description;
      } else {
        logMessage(`Error connecting to ${url}`)
      }
    } catch (err) {
      logException(err)
    }
  });
  */
}

module.exports = getHoroscope;
