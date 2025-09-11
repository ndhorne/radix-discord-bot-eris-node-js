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

const getUser = require("./getuser.js");

const games = global.states.games;

function makeGameMove(msg, content) {
  const user = getUser(msg);
  const gamesInProgress = games[Symbol.for("gamesInProgress")];
  const instance = gamesInProgress[msg.channel.id].instance;
  
  //check for captcha
  if (
    (instance.captcha)
    && (instance.captcha.options.text === content)
  ) {
    if (
      (
        (instance.getCurrentPlayer)
        && (instance.getCurrentPlayer().id === user.id)
      )
      || (
        (!instance.getCurrentPlayer)
        && (instance.players.find(u => u.id === user.id))
      )
    ) {
      instance.clearGameTimeout();
      
      instance.print("Captcha accepted!");
      
      instance.setGameTimeout();
    }
    
    return true;
  }
  
  switch (gamesInProgress[msg.channel.id].key) {
    case "connect4": //connect 4
      if (
        msg.channel.id in games.connect4
        && (
          games.connect4[msg.channel.id].players[0]
          && games.connect4[msg.channel.id].players[1]
        )
        && (
          user.id === games.connect4[msg.channel.id].players[0].id
          || user.id === games.connect4[msg.channel.id].players[1].id
        )
        && (
          (
            isFinite(+content)
            && (
              (+content >= 1) && (+content <= 7)
            )
          )
        )
      ) {
        games.connect4[msg.channel.id].move(msg, content);
        return true;
      }
      break;
    
    case "hangman": //hangman
      if (
        msg.channel.id in games.hangman
        && games.hangman[msg.channel.id].player
        && user.id === games.hangman[msg.channel.id].player.id
        && (
          (
            typeof content === "string"
            && /^[a-zA-Z]+$/.test(content)
            && (
              content.length === 1
              || content.length === games.hangman[msg.channel.id].word.length
            )
          )
        )
      ) {
        games.hangman[msg.channel.id].turn(msg, content);
        return true;
      }
      break;
    
    case "matchstick": //matchstick game
      if (
        msg.channel.id in games.matchstick
        && (
          games.matchstick[msg.channel.id].players[0]
          && games.matchstick[msg.channel.id].players[1]
        )
        && (
          user.id === games.matchstick[msg.channel.id].players[0].id
          || user.id === games.matchstick[msg.channel.id].players[1].id
        )
        && (
          (
            isFinite(+content)
            && (
              (+content >= 1) && (+content <= 3)
            )
          )
        )
      ) {
        games.matchstick[msg.channel.id].turn(msg, content);
        return true;
      }
      break;
    
    case "notwordle": //not wordle
      if (
        msg.channel.id in games.notwordle
        && games.notwordle[msg.channel.id].player
        && user.id === games.notwordle[msg.channel.id].player.id
        && (
          (typeof content === "string" && /^[a-zA-Z]{5}$/.test(content))
        )
      ) {
        games.notwordle[msg.channel.id].turn(msg, content);
        return true;
      }
      break;
    
    case "randomactsofascii": //random acts of ascii
      if (
        msg.channel.id in games.randomactsofascii
        && games.randomactsofascii[msg.channel.id].started
        && games.randomactsofascii[msg.channel.id].state === 0
        && games.randomactsofascii[msg.channel.id].players.find(
          u => u.id === user.id
        )
        && (
          (
            typeof content === "string"
            && /^[a-zA-z -]+$/.test(content)
            && (
              content.length
              === games.randomactsofascii[msg.channel.id].phrase.length
            )
          )
        )
      ) {
        games.randomactsofascii[msg.channel.id].validate(msg, content);
        return true;
      }
      break;
    
    case "tictactoe": //tic tac toe
      if (
        msg.channel.id in games.tictactoe
        && (
          games.tictactoe[msg.channel.id].players[0]
          && games.tictactoe[msg.channel.id].players[1]
        )
        && (
          user.id === games.tictactoe[msg.channel.id].players[0].id
          || user.id === games.tictactoe[msg.channel.id].players[1].id
        )
        && (
          (
            isFinite(+content)
            && (
              (+content >= 1) && (+content <= 9)
            )
          )
        )
      ) {
        games.tictactoe[msg.channel.id].move(msg, content);
        return true;
      }
      break;
    
    default:
      throw new Error("Game not found");
    //end cases
  }
  
  return false;
}

module.exports = makeGameMove;
