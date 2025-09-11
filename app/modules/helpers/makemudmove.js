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

const getUser = require("./getuser.js");

const { logException } = require("./loggers.js");

const muds = global.states.muds;

function makeMUDMove(msg, content) {
  const user = getUser(msg);
  const mudders = muds[Symbol.for("mudders")];
  
  try {
    switch(mudders[user.id].key) {
      case "mudmaze":
        muds.mudmaze.parse(msg, content);
        return true;
      
      default:
        throw new Error("MUD not found");
      //end cases
    }
  } catch (err) {
    logException(err);
  }
  
  return false;
}

module.exports = makeMUDMove;
