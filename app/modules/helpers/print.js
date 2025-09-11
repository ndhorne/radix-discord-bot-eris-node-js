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

const {
  Channel,
  CommandInteraction,
  ComponentInteraction,
  Message
} = require("eris");

const isRequestError = require("./isrequesterror.js");

const { logException } = require("./loggers.js");

const bot = global.bot;

async function print(medium, content, file) {
  try {
    const channel = function() {
      if (
        medium instanceof Message
        || medium instanceof CommandInteraction
        || medium instanceof ComponentInteraction
      ) return medium.channel;
      
      if (
        medium instanceof Channel
        || Object.prototype.hasOwnProperty.call(medium, "id")
      ) return medium;
      
      throw new Error("Channel not found");
    }();
    
    if (
      medium instanceof CommandInteraction
      || medium instanceof ComponentInteraction
    ) {
      await medium.createMessage(content, file);
    } else {
      return await bot.createMessage(channel.id, content, file);
    }
  } catch (err) {
    logException(err);
    
    if (isRequestError(err)) {
      return await print(medium, content, file);
    }
  }
}

module.exports = print;
