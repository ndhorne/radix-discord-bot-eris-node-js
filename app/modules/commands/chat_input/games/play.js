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

const getHelp = require("../help.js");

const isDM = require("../../../helpers/isdm.js");
const getUser = require("../../../helpers/getuser.js");
const updateStatus = require("../../../helpers/updatestatus.js");

const TicTacToe = require("../../../games/tictactoe/tictactoe.js");
const Connect4 = require("../../../games/connect4/connect4.js");
const Hangman = require("../../../games/hangman/hangman.js");
const Matchstick = require("../../../games/matchstick/matchstick.js");
const NotWordle = require("../../../games/notwordle/notwordle.js");
const RandomActsOfAscii =
  require("../../../games/randomactsofascii/randomactsofascii.js")
;

const games = global.states.games;
const whitelists = global.whitelists.games;

async function startGame(msg, args) {
  const user = getUser(msg);
  
  let started = false;
  
  function getMessage(msg, args) {
    if (msg instanceof CommandInteraction) {
      return {
        content: started ? "Game started" : "Game in progress",
        flags: 64
      };
    }
  }
  
  function update() {
    updateStatus();
    started = true;
  }
  
  if (msg.channel.id in games[Symbol.for("gamesInProgress")]) {
    return getMessage(msg, args);
  }
  
  switch(args[0]) {
    case "connect4":
      if (!isDM(msg) && !whitelists.connect4.includes(msg.channel.id)
      ) {
        return "Channel not whitelisted for game Connect4!";
      }
      
      games.connect4[msg.channel.id] = new Connect4(msg, args.slice(1));
      games[Symbol.for("gamesInProgress")][msg.channel.id] = {
        id: msg.channel.id,
        instance: games.connect4[msg.channel.id],
        channel: msg.channel,
        name: "Connect 4",
        starter: user,
        timestamp: Date.now(),
        key: "connect4"
      };
      update();
      break;
    
    case "hangman":
      if (!isDM(msg) && !whitelists.hangman.includes(msg.channel.id)
      ) {
        return "Channel not whitelisted for game Hangman!";
      }
      
      games.hangman[msg.channel.id] = new Hangman(msg, args.slice(1));
      games[Symbol.for("gamesInProgress")][msg.channel.id] = {
        id: msg.channel.id,
        instance: games.hangman[msg.channel.id],
        channel: msg.channel,
        name: "Hangman",
        starter: user,
        timestamp: Date.now(),
        key: "hangman"
      };
      update();
      break;
    
    case "matchstick":
      if (!isDM(msg) && !whitelists.matchstick.includes(msg.channel.id)
      ) {
        return "Channel not whitelisted for game Matchstick Game!";
      }
      
      games.matchstick[msg.channel.id] = new Matchstick(msg, args.slice(1));
      games[Symbol.for("gamesInProgress")][msg.channel.id] = {
        id: msg.channel.id,
        instance: games.matchstick[msg.channel.id],
        channel: msg.channel,
        name: "Matchstick Game",
        starter: user,
        timestamp: Date.now(),
        key: "matchstick"
      };
      update();
      break;
    
    case "notwordle":
      if (!isDM(msg) && !whitelists.notwordle.includes(msg.channel.id)
      ) {
        return "Channel not whitelisted for game Definitely Not Wordle!";
      }
    
      games.notwordle[msg.channel.id] = new NotWordle(msg, args.slice(1));
      games[Symbol.for("gamesInProgress")][msg.channel.id] = {
        id: msg.channel.id,
        instance: games.notwordle[msg.channel.id],
        channel: msg.channel,
        name: "Definitely Not Wordle",
        starter: user,
        timestamp: Date.now(),
        key: "notwordle"
      };
      update();
      break;
    
    case "randomactsofascii":
      if (!isDM(msg) && !whitelists.randomactsofascii.includes(msg.channel.id)
      ) {
        return "Channel not whitelisted for game Random Acts of ASCII!";
      }
      
      games.randomactsofascii[msg.channel.id] = new RandomActsOfAscii(
        msg, args.slice(1)
      );
      games[Symbol.for("gamesInProgress")][msg.channel.id] = {
        id: msg.channel.id,
        instance: games.randomactsofascii[msg.channel.id],
        channel: msg.channel,
        name: "Random Acts of ASCII",
        starter: user,
        timestamp: Date.now(),
        key: "randomactsofascii"
      };
      update();
      break;
    
    case "tictactoe":
      if (!isDM(msg) && !whitelists.tictactoe.includes(msg.channel.id)
      ) {
        return "Channel not whitelisted for game Tic Tac Toe!";
      }
      
      games.tictactoe[msg.channel.id] = new TicTacToe(msg, args.slice(1));
      games[Symbol.for("gamesInProgress")][msg.channel.id] = {
        id: msg.channel.id,
        instance: games.tictactoe[msg.channel.id],
        channel: msg.channel,
        name: "Tic Tac Toe",
        starter: user,
        timestamp: Date.now(),
        key: "tictactoe"
      };
      update();
      break;
    
    default:
      return await getHelp(msg, ["games", "play"]);
    //end cases
  }
  
  return getMessage(msg, args);
}

module.exports = startGame;
