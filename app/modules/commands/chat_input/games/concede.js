/*
Copyright (C) 2023 Nicholas D. Horne

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
const getConcisePrefix = require("../../../helpers/getconciseprefix.js");

const { logException } = require("../../../helpers/loggers.js");

const games = global.states.games;

async function concede(msg, args) {
  const user = getUser(msg);
  const id = msg.channel.id;
  
  let str = "";
  
  function killGame(id) {
    if (id in games[Symbol.for("gamesInProgress")]) {
      const game = games[Symbol.for("gamesInProgress")][id].instance;
      
      game.endGame();
    } else {
      throw new Error(`Game ${id} not found`);
    }
  }
  
  try {
    if (
      id in games[Symbol.for("gamesInProgress")]
    ) {
      if (
        games[Symbol.for("gamesInProgress")][id].instance
        .players.find(player => player.id === user.id)
      ) {
        if (
          games[Symbol.for("gamesInProgress")][id].instance.started
        ) {
          if (
            !games[Symbol.for("gamesInProgress")][id].instance.singleplayer
            && (
              games[Symbol.for("gamesInProgress")][id].instance
              .players.length === 2
            )
          ) {
            const opponent = games[Symbol.for("gamesInProgress")][id].instance
              .players.find(player => player.id !== user.id)
            ;
            
            str = `${user.username} concedes game, ${opponent.username} wins!`;
            
            killGame(id);
          } else {
            if (
              games[Symbol.for("gamesInProgress")][id].instance
              .players.length > 2
            ) {
              str = "Cannot concede games with more than two players";
            } else if (
              games[Symbol.for("gamesInProgress")][id].instance.singleplayer
              || (
                games[Symbol.for("gamesInProgress")][id].instance
                .players.length === 1
              )
            ) {
              str = "Cannot concede singleplayer games, try "
                + getConcisePrefix(msg)
                + "gameover"
              ;
            }
          }
        } else {
          str = "Cannot concede unstarted games, try "
            + getConcisePrefix(msg)
            + "gameover"
          ;
        }
      } else {
        if (msg instanceof CommandInteraction) {
          str = "Nothing to concede, you are not a player in the current game";
        }
      }
    } else {
      if (msg instanceof CommandInteraction) {
        str = `No game in progress for channel ${id}`;
      }
    }
  } catch (e) {
    logException(e);
    
    if (msg instanceof CommandInteraction) str = e.message;
  }
  
  return str.trim();
}

module.exports = concede;
