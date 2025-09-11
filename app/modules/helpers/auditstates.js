/*
Copyright (C) 2023, 2024 Nicholas D. Horne

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
  Interaction,
  Message
} = require("eris");

const isDM = require("./isdm.js");
const updateState = require("./updatestate.js");
const getDMChannel = require("./getdmchannel.js");
const getRESTChannel = require("./getrestchannel.js");

const { logException } = require("./loggers.js");

const bot = global.bot;
const states = global.states;

async function auditStates(msg, command, args) {
  try {
    if (
      msg instanceof Interaction
      && !(
        msg instanceof CommandInteraction || msg instanceof ComponentInteraction
      )
    ) throw new Error("Unexpected interaction encountered");  
    
    const channel = await async function() {
      if (msg.channel instanceof Channel) return msg.channel;
      
      if (msg instanceof Interaction) {
        if (isDM(msg)) {
          return (await getDMChannel(msg.user.id));
        } else {
          return (await getRESTChannel(msg.channel.id));
        }
      }
    }();
    
    const lastMessageID = (
      msg instanceof Interaction
      ? (
        isDM(msg)
        ? channel.lastMessageID //no Collection<Message> for DMs, best effort
        : (
          msg instanceof ComponentInteraction
          ? (
            channel.messages.find(
              message => msg.message.id === message.messageReference?.messageID
            ).id
          )
          : (
            channel.messages.find(
              message => msg.id === message.interaction?.id
            ).id
          )
        )
      )
      : msg.id
    );
    
    let state;
    
    if (
      command === "angryflower"
      || (command === "gallery" && args[0] === "angryflower")
      || (
        command === "query"
        && args[0] === "gallery"
        && args[1] === "angryflower"
      )
    ) {
      state = states.galleries.angryflower;
    }
    
    if (
      command === "met"
      || (command === "gallery" && args[0] === "met")
      || (
        command === "query"
        && args[0] === "gallery"
        && args[1] === "met"
      )
    ) {
      state = states.galleries.met;
    }
    
    if (
      command === "pokey"
      || (command === "gallery" && args[0] === "pokey")
      || (
        command === "query"
        && args[0] === "gallery"
        && args[1] === "pokey"
      )
    ) {
      state = states.galleries.pokey;
    }
    
    if (
      command === "xkcd"
      || (command === "gallery" && args[0] === "xkcd")
      || (
        command === "query"
        && args[0] === "gallery"
        && args[1] === "xkcd"
      )
    ) {
      state = states.galleries.xkcd;
    }
    
    if (state) {
      updateState(
        state,
        msg.channel.id,
        "lastMessageID",
        lastMessageID
      );
    }
  } catch(err) {
    logException(err);
  }
}

module.exports = auditStates;
