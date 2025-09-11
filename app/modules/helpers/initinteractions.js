/*
Copyright (C) 2022, 2023, 2024, 2025 Nicholas D. Horne

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

const bot = global.bot;

function isSubCommand(arg) {
  return arg === Constants.ApplicationCommandOptionTypes.SUB_COMMAND;
}

async function initInteractions() {
  const commands = [
    require("../interactions/command/chat_input/horoscope.js"),
    require("../interactions/command/chat_input/8ball.js"),
    require("../interactions/command/chat_input/fortune.js"),
    require("../interactions/command/chat_input/currency.js"),
    //require("../interactions/command/chat_input/uptime.js"),
    require("../interactions/command/chat_input/play.js"),
    require("../interactions/command/chat_input/join.js"),
    require("../interactions/command/chat_input/hint.js"),
    require("../interactions/command/chat_input/start.js"),
    require("../interactions/command/chat_input/accept.js"),
    require("../interactions/command/chat_input/concede.js"),
    require("../interactions/command/chat_input/gameover.js"),
    require("../interactions/command/chat_input/nowplaying.js"),
    require("../interactions/command/chat_input/roll.js"),
    //require("../interactions/command/chat_input/about.js"),
    //require("../interactions/command/chat_input/source.js"),
    require("../interactions/command/chat_input/info.js"),
    require("../interactions/command/chat_input/gallery.js"),
    require("../interactions/command/chat_input/feedback.js"),
    require("../interactions/command/chat_input/rot13.js"),
    require("../interactions/command/chat_input/randpass.js"),
    //require("../interactions/command/chat_input/xkcd.js"),
    //require("../interactions/command/chat_input/met.js"),
    //require("../interactions/command/chat_input/hello.js"),
    //require("../interactions/command/chat_input/miau.js"),
    require("../interactions/command/chat_input/enter.js"),
    require("../interactions/command/user/slap.js"),
  ];
  
  const registeredCommands = await bot.getCommands();
  let refreshCommands = false;
  
  //Does not take into account subcommands
  const newCommands = commands.filter(command => {
    return !registeredCommands.find(registeredCommand => {
      return registeredCommand.name === command.name;
    });
  });
  
  if (
    commands.length !== registeredCommands.length
    || newCommands.length > 0
  ) refreshCommands = true;
  
  //Check subcommands
  if (!refreshCommands) {
    commands.filter(command => {
      return command.options?.some(option => {
        return isSubCommand(option.type);
      });
    }).forEach(command => {
      const registeredCommand = registeredCommands.find(registeredCommand => {
        return registeredCommand.name === command.name;
      });
      
      if (registeredCommand) {
        const commandSubCommands = command.options.filter(option => {
          return isSubCommand(option.type);
        });
        
        const registeredCommandSubCommands = registeredCommand.options
          ? (
            registeredCommand.options.filter(option => {
              return isSubCommand(option.type);
            })
          )
          : []
        ;
        
        if (
          commandSubCommands.length !== registeredCommandSubCommands.length
          || (
            !commandSubCommands.every(subCommand => {
              return (
                registeredCommandSubCommands.find(
                  registeredCommandSubCommand => {
                    return registeredCommandSubCommand.name === subCommand.name;
                  }
                )
              );
            })
          )
        ) refreshCommands = true;
      }
    });
  }
  
  if (refreshCommands) {
    /*
    Array.from(
      await bot.getCommands()
    ).forEach(
      async command => await bot.deleteCommand(command.id)
    );
    
    commands.forEach(command => bot.createCommand(command));
    */
    
    await bot.bulkEditCommands([]);
    await bot.bulkEditCommands(commands);
  }
}

module.exports = initInteractions;
