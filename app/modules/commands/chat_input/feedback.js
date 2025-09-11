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

const { CommandInteraction } = require("eris");

const getHelp = require("./help.js");
const getUser = require("../../helpers/getuser.js");
const print = require("../../helpers/print.js");
const getDMChannel = require("../../helpers/getdmchannel.js");

const bot = global.bot;
const owner = global.owner;

const response = "Thank you for your feedback!";

async function sendFeedback(msg, args) {
  if (args.length === 0) return await getHelp(msg, ["feedback"]);
  
  const user = getUser(msg);
  
  const feedback = (
    `Date: ${new Date().toString()}\n`
    + `User: ${user.username} (${user.id})\n`
    + args.join(" ")
  );
  
  //await bot.createMessage((await bot.getDMChannel(owner)).id, feedback);
  await print(await getDMChannel(owner), feedback);
  
  if (msg instanceof CommandInteraction) {
    return {
      content: response,
      flags: 64,
    };
  } else {
    return response;
  }
}

module.exports = sendFeedback;
