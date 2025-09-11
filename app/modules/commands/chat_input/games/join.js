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

async function join(msg, args) {
  const user = getUser(msg);
  
  let joined = false;
  let falseText = "Nothing to join";

  function getMessage(msg) {
    if (msg instanceof CommandInteraction) {
      return {
        content: joined ? "Game joined" : falseText,
        flags: 64
      };
    }
  }
  
  if (msg.channel.id in games[Symbol.for("gamesInProgress")]) {
    //tic tac toe
    if (
      (msg.channel.id in games.tictactoe)
      && (!games.tictactoe[msg.channel.id].players[1])
    ) {
      games.tictactoe[msg.channel.id].join(msg);
      joined = true;
    }
    
    //connect4
    if (
      (msg.channel.id in games.connect4)
      && (!games.connect4[msg.channel.id].players[1])
    ) {
      games.connect4[msg.channel.id].join(msg);
      joined = true;
    }
    
    //matchstick game
    if (
      (msg.channel.id in games.matchstick)
      && (!games.matchstick[msg.channel.id].players[1])
    ) {
      games.matchstick[msg.channel.id].join(msg);
      joined = true;
    }
    
    //random acts of ascii
    if (
      (msg.channel.id in games.randomactsofascii)
      && !games.randomactsofascii[msg.channel.id].started
      && (
        !games.randomactsofascii[msg.channel.id].players.find(
          u => u.id === user.id
        )
      )
    ) {
      games.randomactsofascii[msg.channel.id].join(msg);
      joined = true;
    }
  }
  
  if (!joined) {
    if (msg.channel.id in games[Symbol.for("gamesInProgress")]) {
      if (
        //tic tac toe
        (
          (msg.channel.id in games.tictactoe)
          && (
            games.tictactoe[msg.channel.id].players.find(
              u => u.id === user.id
            )
          )
        )
        //connect 4
        || (
          (msg.channel.id in games.connect4)
          && (
            games.connect4[msg.channel.id].players.find(
              u => u.id === user.id
            )
          )
        )
        //matchstick game
        || (
          (msg.channel.id in games.matchstick)
          && (
            games.matchstick[msg.channel.id].players.find(
              u => u.id === user.id
            )
          )
        )
        //random acts of ascii
        || (
          (msg.channel.id in games.randomactsofascii)
          && (
            games.randomactsofascii[msg.channel.id].players.find(
              u => u.id === user.id
            )
          )
        )
      ) {
        falseText = "Already joined";
      }
    }
  }
  
  return getMessage(msg);
}

module.exports = join;
