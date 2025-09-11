/*
Copyright (C) 2024 Nicholas D. Horne

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

const print = require("../../helpers/print.js");
const getDMChannel = require("../../helpers/getdmchannel.js");
const isRequestError = require("../../helpers/isrequesterror.js");

const { logException } = require("../../helpers/loggers.js");

const bot = global.bot;

/*
async function getDMChannel(id) {
  try {
    return await bot.getDMChannel(id);
  } catch (err) {
    logException(err);
    
    if (isRequestError(err)) {
      return await getDMChannel(id);
    }
  }
}
*/

async function relay(players, message) {
  let current;
  
  try {
    players.forEach(async (player, index) => {
      current = index;
      print(await (getDMChannel(player.id)), message);
    });
  } catch (err) {
    logException(err);
    
    if (isRequestError(err)) {
      relay(players.slice(current), message);
    }
  }
}

module.exports = relay;
