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

const games = global.states.games;

async function accept(msg, args) {
  let accepted = false;
  
  function getMessage(msg) {
    if (msg instanceof CommandInteraction) {
      return {
        content: accepted ? "Challenge accepted" : "Nothing to accept",
        flags: 64
      };
    }
  }
  
  if (msg.channel.id in games[Symbol.for("gamesInProgress")]) {
    //hangman
    if (
      msg.channel.id in games.hangman
      && !games.hangman[msg.channel.id].started
    ) {
      games.hangman[msg.channel.id].accept(msg);
      accepted = true;
    }
    
    //not wordle
    if (
      msg.channel.id in games.notwordle
      && !games.notwordle[msg.channel.id].started
    ) {
      games.notwordle[msg.channel.id].accept(msg);
      accepted = true;
    }
  }
  
  return getMessage(msg);
}

module.exports = accept;
