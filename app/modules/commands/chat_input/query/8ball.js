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

const getHelp = require("../help.js");

const { logMessage, logException } = require("../../../helpers/loggers.js");

async function get8ballReading(msg, args) {
  if (args.length === 0 || args.join(" ") === "") {
    return await getHelp(msg, ["query", "8ball"]);
  }
  
  const question = encodeURIComponent(args.join(" "));
  
  //const uri = "https://8ball.delegator.com/magic/JSON/" + question;
  
  const uri = `https://eightballapi.com/api?question=${question}&lucky=false`;
  
  try {
    const response = await fetch(uri);
    
    if (response.ok) {
      const result = await response.json();
      
      //return result.magic.answer; //8ball.delegator.com
      
      return result.reading; //eightballapi.com
    } else {
      logMessage(`Error connecting to ${uri}`);
    }
  } catch (err) {
    logException(err);
  }
}

module.exports = get8ballReading;
