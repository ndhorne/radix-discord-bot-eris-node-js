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

const { Message } = require("eris");

const handlers = global.handlers;

async function invokeHandler(msg, command, args = [], type = 1) {
  let handler;
  
  if (type === 1) {
    handler = handlers.chatInput[command];
  } else if (type === 2) {
    handler = handlers.user[command];
  }
  
  if (!handler && type === 1 && msg instanceof Message) {
    return handlers.chatInput["help"](msg, args);
  } else if (!handler) {
    return;
  }
  
  return handler(msg, args);
}

module.exports = invokeHandler;
