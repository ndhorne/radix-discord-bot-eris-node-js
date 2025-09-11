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

const { Constants } = require("eris");

const galleryCommand = {
  name: "gallery",
  description: "Query a gallery",
  options: [
    {
      name: "met",
      description: "Query Met Collection",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      options: [
        {
          name: "id",
          description: "<Met Object ID>",
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: false,
          min_value: 1,
        },
      ],
    },
    {
      name: "angryflower",
      description: "Query Bob the Angry Flower",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      options: [
        {
          name: "id",
          description: "<#>",
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: false,
          min_value: 1,
        },
      ],
    },
    {
      name: "pokey",
      description: "Query Pokey the Penguin archives",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      options: [
        {
          name: "id",
          description: "<#>",
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: false,
          min_value: 1,
        },
      ],
    },
    {
      name: "xkcd",
      description: "Query xkcd",
      type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
      options: [
        {
          name: "id",
          description: "<xkcd #>",
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: false,
          min_value: 1,
        },
      ],
    },
  ],
};

module.exports = galleryCommand;
