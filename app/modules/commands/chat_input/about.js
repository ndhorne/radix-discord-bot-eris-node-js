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

function about(msg, args) {
  /*
  const str = "A general-purpose Discord bot powered by JavaScript, Node.js, "
    + "and the Eris Node.js Discord library featuring chat-roomified "
    + "renditions of familiar games such as Connect 4, Hangman, Tic Tac Toe, "
    + "(Definitely Not) Wordle, and Nim (the matchstick game), alongside some "
    + "likely unfamiliar originals such as Random Acts of ASCII; "
    + "Multi-User Dungeons (aka MUDs) such as MUD Maze, a MUD where you "
    + "traverse a maze in real time with other players; browsable galleries "
    + "featuring the catalogs of The Metropolitan Museum of Art and "
    + "long-running well-known web comics such as Bob the Angry Flower, Pokey "
    + "the Penguin, and xkcd; and of course many of the standard amenities "
    + "that discerning chat bot connoisseurs have come to expect a chat bot to "
    + "provide such as dungeons and dragons dice, horoscopes, fortunes, magic "
    + "8 ball, currency converter, and many more. `$rdx help` to get started"
  ;
  */
  
  const str = "This bot is what Willis was talking about.";
  
  if (msg instanceof CommandInteraction) {
    return {
      content: str,
      flags: 64,
    };
  } else {
    return str;
  }
}

module.exports = about;
