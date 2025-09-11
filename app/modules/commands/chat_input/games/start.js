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

const { CommandInteraction } = require("eris");

const getUser = require("../../../helpers/getuser.js");

const games = global.states.games;

async function start(msg, args) {
  const user = getUser(msg);
  
  let started = false;

  function getMessage(msg) {
    if (msg instanceof CommandInteraction) {
      return {
        content: started ? "Game started" : "Nothing to start",
        flags: 64
      };
    }
  }
  
  if (msg.channel.id in games[Symbol.for("gamesInProgress")]) {
    //random acts of ascii
    if (
      msg.channel.id in games.randomactsofascii
      && !games.randomactsofascii[msg.channel.id].started
      && (
        games.randomactsofascii[msg.channel.id].players[0].id
        === user.id
      )
    ) {
      games.randomactsofascii[msg.channel.id].startGame(msg);
      started = true;
    }
  }
  
  return getMessage(msg);
}

module.exports = start;
