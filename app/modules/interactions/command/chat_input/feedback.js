/*
Copyright (C) 2024 Nicholas D. Horne

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

const feedbackCommand = {
  name: "feedback",
  description: "Send feedback to bot owner",
  options: [
    {
      name: "feedback",
      description: "<feedback>",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
    },
  ],
};

module.exports = feedbackCommand;
