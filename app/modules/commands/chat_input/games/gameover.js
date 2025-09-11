/*
Copyright (C) 2022, 2023, 2024 Nicholas D. Horne

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

const { logException } = require("../../../helpers/loggers.js");

const admins = global.admins;
const games = global.states.games;

async function stopGame(msg, args) {
  const user = getUser(msg);
  const who = `${user.username}`;
  
  if (args.length === 1 && msg instanceof CommandInteraction) {
    args = args[0].trim().split(" ");
  }
  
  let str = "", noArgs = (args.length === 0 ? true : false);
  
  function killGame(id) {
    if (id in games[Symbol.for("gamesInProgress")]) {
      const game = games[Symbol.for("gamesInProgress")][id].instance;
      
      game.endGame();
    } else {
      throw new Error(`Game ${id} not found`);
    }
  }
  
  function voteToKill(id) {
    if (
      games[Symbol.for("gamesInProgress")][id].instance.players
      .find(player => player.id === user.id)
    ) {
      str = games[Symbol.for("gamesInProgress")][id].instance.voteToKill(msg);
    } else {
      if (msg instanceof CommandInteraction) {
        str += (str != "" ? "\n" : "") + "You are not a player in that game";
      }
    }
  }
  
  if (noArgs) args.push(msg.channel.id);
  
  args.forEach(function(id, index) {
    if (
      id in games[Symbol.for("gamesInProgress")]
    ) {
      if (
        games[Symbol.for("gamesInProgress")][id].starter.id === user.id
        || (admins.includes(user.id) && !noArgs)
      ) {
        if (
          !games[Symbol.for("gamesInProgress")][id].instance.started
          || games[Symbol.for("gamesInProgress")][id].instance.singleplayer
          || (admins.includes(user.id) && !noArgs)
        ) {
          try {
            const name = games[Symbol.for("gamesInProgress")][id].name;
            
            killGame(id);
            
            str += (index > 0 ? "\n" : "")
              + `${name} game ${id} prematurely terminated by ${who}`
            ;
          } catch (err) {
            logException(err);
            
            str += (index > 0 ? "\n" : "") + err.message;
          }
        } else {
          voteToKill(id);
        }
      } else {
        voteToKill(id);
      }
    } else {
      if (msg instanceof CommandInteraction) {
        str += (index > 0 ? "\n" : "")
          + `No game in progress for channel ${id}`
        ;
      }
    }
  });
  
  return str.trim();
}

module.exports = stopGame;
