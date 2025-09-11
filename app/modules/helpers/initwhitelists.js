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

function initWhitelists() {
  return {
    games: {
      connect4: [...new Set(
        [process.env.WHITELIST_GAME_CONNECT4?.split(",")]
        .concat(process.env.WHITELIST_TESTING?.split(","))
        .filter(guildID => guildID)
      )],
      hangman: [...new Set(
        [process.env.WHITELIST_GAME_HANGMAN?.split(",")]
        .concat(process.env.WHITELIST_TESTING?.split(","))
        .filter(guildID => guildID)
      )],
      matchstick: [...new Set(
        [process.env.WHITELIST_GAME_MATCHSTICK?.split(",")]
        .concat(process.env.WHITELIST_TESTING?.split(","))
        .filter(guildID => guildID)
      )],
      notwordle: [...new Set(
        [process.env.WHITELIST_GAME_NOTWORDLE?.split(",")]
        .concat(process.env.WHITELIST_TESTING?.split(","))
        .filter(guildID => guildID)
      )],
      randomactsofascii: [...new Set(
        [process.env.WHITELIST_GAME_RANDOMACTSOFASCII?.split(",")]
        .concat(process.env.WHITELIST_TESTING?.split(","))
        .filter(guildID => guildID)
      )],
      tictactoe: [...new Set(
        [process.env.WHITELIST_GAME_TICTACTOE?.split(",")]
        .concat(process.env.WHITELIST_TESTING?.split(","))
        .filter(guildID => guildID)
      )],
    },
    galleries: {
      angryflower: [...new Set(
        [process.env.WHITELIST_GALLERY_ANGRYFLOWER?.split(",")]
        .concat(process.env.WHITELIST_TESTING?.split(","))
        .filter(guildID => guildID)
      )],
      met: [...new Set(
        [process.env.WHITELIST_GALLERY_MET?.split(",")]
        .concat(process.env.WHITELIST_TESTING?.split(","))
        .filter(guildID => guildID)
      )],
      pokey: [...new Set(
        [process.env.WHITELIST_GALLERY_POKEY?.split(",")]
        .concat(process.env.WHITELIST_TESTING?.split(","))
        .filter(guildID => guildID)
      )],
      xkcd: [...new Set(
        [process.env.WHITELIST_GALLERY_XKCD?.split(",")]
        .concat(process.env.WHITELIST_TESTING?.split(","))
        .filter(guildID => guildID)
      )],
    },
  };
}

module.exports = initWhitelists;
