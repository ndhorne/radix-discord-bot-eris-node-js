/*
Copyright (C) 2022 Nicholas D. Horne

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

function getPlayArgs(gameName, gameOptions) {
  return [gameName].concat(
    gameOptions.length > 0
    ? (
      (function() {
        const gameArgs = [];
        
        if (gameName === "tictactoe") {
          gameArgs.push(gameOptions.find(
            arg => arg.name === "number_of_players"
          ));
        } else if (gameName === "connect4") {
          gameArgs.push(gameOptions.find(
            arg => arg.name === "number_of_players"
          ));
        } else if (gameName === "hangman") {
          gameArgs.push(
            gameOptions.find(
              arg => arg.name === "challenge" && arg.value
            )
            || gameOptions.find(
              arg => arg.name === "min_number_of_letters"
            )
          );
          gameArgs.push(gameOptions.find(
            arg => arg.name === "max_number_of_letters"
          ));
        } else if (gameName === "matchstick") {
          gameArgs.push(gameOptions.find(
            arg => arg.name === "number_of_players"
          ));
          gameArgs.push(gameOptions.find(
            arg => arg.name === "number_of_sticks"
          ));
        } else if (gameName === "randomactsofascii") {
          gameArgs.push(gameOptions.find(
            arg => arg.name === "number_of_expressions"
          ));
          gameArgs.push(gameOptions.find(
            arg => arg.name === "singleplayer"
          ));
        } else if (gameName === "notwordle") {
          gameArgs.push(gameOptions.find(
            arg => arg.name === "challenge"
          ));
        }
        
        return gameArgs.map(arg => arg ? arg.value : undefined);
      })()
    )
    : []
  );
}

module.exports = getPlayArgs;
