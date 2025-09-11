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

//const getHelp = require("../help.js");

const HTMLParser = require("node-html-parser");

const { logMessage, logException } = require("../../../helpers/loggers.js");

async function getFortune(msg, args) {
  const url = "https://joshmadison.com/2008/04/20/fortune-cookie-fortunes/";
  
  //const url = "http://yerkee.com/api/fortune";
  
  //const url = "https://digital-fortune-cookies-api.herokuapp.com/fortune";
  
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
        
        if (result.success) {
          return `${result.cookie.fortune}\n`
            + "Lucky numbers: "
            + `${result.cookie.luckyNumbers[0]}, `
            + `${result.cookie.luckyNumbers[1]}, `
            + `${result.cookie.luckyNumbers[2]}, `
            + `${result.cookie.luckyNumbers[3]}, `
            + `${result.cookie.luckyNumbers[4]}, `
            + `${result.cookie.luckyNumbers[5]}`
          ;
        }
      } else {
        //getHelp(msg, ["query", "fortune"]);
        logMessage(`Error connecting to ${url}`)
      }
    } catch (err) {
      logException(err);
    }
  });
  */
  
  try {
    const response = await fetch(url);
    if (response.ok) {
      //const result = await response.json();
      
      //digital-fortune-cookies-api.herokuapp.com/fortune
      /*
      if (result.success) {
        return `${result.cookie.fortune}\n`
          + "Lucky numbers: "
          + `${result.cookie.luckyNumbers[0]}, `
          + `${result.cookie.luckyNumbers[1]}, `
          + `${result.cookie.luckyNumbers[2]}, `
          + `${result.cookie.luckyNumbers[3]}, `
          + `${result.cookie.luckyNumbers[4]}, `
          + `${result.cookie.luckyNumbers[5]}`
        ;
      }
      */
      
      //return result.fortune; //yerkee.com/api/fortune
      
      //joshmadison.com
      const body = await response.text();
      const parsed = HTMLParser.parse(body);
      const fortunes = parsed.querySelectorAll("ul")[1].querySelectorAll("li")
        .map(li => li.childNodes[0]._rawText)
        /*
        .map(fortune => {
          const regex = / \(\d+\)$/;
          
          if (regex.test(fortune)) {
            return fortune.slice(0, fortune.search(regex));
          } else {
            return fortune;
          }
        })
        */
      ;
      
      let fortune;
      
      do {
        const regex = / \(\d+\)$/;
        
        fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
        
        if (regex.test(fortune)) {
          fortune = fortune.slice(0, fortune.search(regex));
        }
      } while (fortune.includes('(sic)') || fortune.includes('[sic]'));
      
      return fortune;
    } else {
      logMessage(`Error connecting to ${url}`);
      
      const fortunes = global.data.fortunes.joshmadison;
      
      return fortunes[Math.floor(Math.random() * fortunes.length)];
    }
  } catch (err) {
    logException(err);
  }
}

module.exports = getFortune;
