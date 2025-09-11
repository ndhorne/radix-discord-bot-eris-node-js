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

const { Constants } = require("eris");

const playCommand = {
  name: "play",
  description: "Play a game with another user",
  options: [
    {
      name: "connect4",
      description: "Play Connect 4",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      options: [
        {
          name: "number_of_players",
          description: "<number of players>",
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: false,
          min_value: 1,
          max_value: 2
        }
      ]
    },
    {
      name: "hangman",
      description: "Play Hangman",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      options: [
        {
          name: "min_number_of_letters",
          description: "<min number of letters>",
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: false,
          min_value: 2,
          max_value: 14
        },
        {
          name: "max_number_of_letters",
          description: "<max number of letters>",
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: false,
          min_value: 2,
          max_value: 14
        },
        {
          name: "challenge",
          description: "<challenge string>",
          type: Constants.ApplicationCommandOptionTypes.STRING,
          required: false
        }
      ]
    },
    {
      name: "matchstick",
      description: "Play the Matchstick Game",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      options: [
        {
          name: "number_of_players",
          description: "<number of players>",
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: false,
          min_value: 1,
          max_value: 2
        },
        {
          name: "number_of_sticks",
          description: "<number of sticks>",
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: false,
          min_value: 5
        }
      ]
    },
    {
      name: "notwordle",
      description: "Play Definitely Not Wordle",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      options: [
        {
          name: "challenge",
          description: "<5 letter challenge string>",
          type: Constants.ApplicationCommandOptionTypes.STRING,
          required: false
        }
      ]
    },
    {
      name: "randomactsofascii",
      description: "Play Random Acts of ASCII",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      options: [
        {
          name: "number_of_expressions",
          description: "<number of expressions>",
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: false,
          min_value: 1,
          max_value: 308
        },
        {
          name: "singleplayer",
          description: "[true | false]",
          type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
          required: false
        }
      ]
    },
    {
      name: "tictactoe",
      description: "Play Tic Tac Toe",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      options: [
        {
          name: "number_of_players",
          description: "<number of players>",
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: false,
          min_value: 1,
          max_value: 2
        }
      ]
    },
  ],
};

module.exports = playCommand;
