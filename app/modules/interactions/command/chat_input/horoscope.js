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

const { Constants } = require("eris");

const horoscopeCommand = {
  name: "horoscope",
  description: "What do the stars have in store for you?",
  options: [
    {
      name: "sign",
      description: "<sign>",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
      choices: [
        {
          name: "aries",
          value: "aries"
        },
        {
          name: "taurus",
          value: "taurus"
        },
        {
          name: "gemini",
          value: "gemini"
        },
        {
          name: "cancer",
          value: "cancer"
        },
        {
          name: "leo",
          value: "leo"
        },
        {
          name: "virgo",
          value: "virgo"
        },
        {
          name: "libra",
          value: "libra"
        },
        {
          name: "scorpio",
          value: "scorpio"
        },
        {
          name: "sagittarius",
          value: "sagittarius"
        },
        {
          name: "capricorn",
          value: "capricorn"
        },
        {
          name: "aquarius",
          value: "aquarius"
        },
        {
          name: "pisces",
          value: "pisces"
        }
      ]
    }
  ]
};

module.exports = horoscopeCommand;
