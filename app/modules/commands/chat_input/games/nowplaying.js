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

const { resolve } = require("path");

const getUser = require("../../../helpers/getuser.js");

const dir = resolve(__dirname, "../../../..");

const admins = global.admins;
const games = global.states.games;

async function getGamesInProgress(msg, args) {
  const user = getUser(msg);
  
  let gamesList = "", numberOfGames = 0, str;
  
  for (let game in games[Symbol.for("gamesInProgress")]) {
    numberOfGames++;
    gamesList += (gamesList.length !== 0 ? "\n" : "");
    gamesList +=
      `${games[Symbol.for("gamesInProgress")][game].id}`
      + `[${games[Symbol.for("gamesInProgress")][game].name}]`
      + `<${games[Symbol.for("gamesInProgress")][game].starter.username}>`
    ;
  }
  
  str = `${numberOfGames} game${(numberOfGames !== 1 ? "s" : "")} in progress`;
  
  if (admins.includes(user.id)) {
    str += (gamesList.length !== 0 ? ":\n" + gamesList : "")
  }
  
  if (msg instanceof CommandInteraction) {
    return {
      content: str,
      flags: 64,
    };
  } else {
    return str;
  }
}

module.exports = getGamesInProgress;
