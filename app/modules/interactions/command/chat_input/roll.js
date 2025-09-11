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

const rollCommand = {
  name: "roll",
  description: "Roll Dungeons & Dragons dice",
  options: [
    {
      name: "dice",
      description: "[number of rolls]"
        + "{d2 | d3 | d4 | d6 | d8 | d10 | d12 | d20 | d100 | d%} ..."
      ,
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: false
    }
  ]
};

module.exports = rollCommand;
