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

const { CommandInteraction } = require("eris");

const muds = global.states.muds;

const getHelp = require("./help.js");

const isDM = require("../../helpers/isdm.js");
const getUser = require("../../helpers/getuser.js");

function getResult(msg, str) {
  if (msg instanceof CommandInteraction) {
    return {
      content: str,
      flags: 64,
    };
  } else {
    return str;
  }
}

async function enter(msg, args) {
  const user = getUser(msg);
  const mudders = muds[Symbol.for("mudders")];
  
  if (!isDM(msg)) return getResult(msg, "`enter` is a DM-only command.");
  if (mudders[user.id]) return getResult(msg, "You are already in a MUD!");
  
  switch (args[0]) {
    case "mudmaze":
      mudders[user.id] = {
        name: "MUD Maze",
        channel: msg.channel,
        timestamp: Date.now(),
        key: "mudmaze",
      };
      muds.mudmaze.join(msg);
      break;
      
    default:
      return await getHelp(msg, ["enter"]);
    //end cases
  }
  
  if (msg instanceof CommandInteraction) return getResult(msg, "MUD joined");
}

module.exports = enter;
