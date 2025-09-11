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

const { Constants, CommandInteraction, ComponentInteraction, Message } =
  require("eris")
;

const isDM = require("../../../helpers/isdm.js");
const random = require("../../../helpers/random.js");
const getUser = require("../../../helpers/getuser.js");

const { logMessage, logException } = require("../../../helpers/loggers.js");

const bot = global.bot;
const state = global.states.galleries.pokey;
const whitelist = global.whitelists.galleries.pokey;

async function pokeyQuery(msg, args) {
  if (!isDM(msg) && !whitelist.includes(msg.channel.id)) {
    return "Channel not whitelisted for gallery Pokey the Penguin!";
  }
  
  if (!state[msg.channel.id]) state[msg.channel.id] = Object.create(null);
  
  state[msg.channel.id].inProgress = true;
  
  let id = args[0], last = 787; //latest comic at the time of this writing
  
  const user = getUser(msg);
  
  let content = `${user.username} queries the Pokey the Penguin archives!`;
  
  if (msg instanceof ComponentInteraction && args[1]) content += ` ${args[1]}`;
  
  const message = Object.create(null);
  
  try {
    while (
      await fetch(
        `http://yellow5.com/pokey/archive/pokey${last + 1}.gif`,
        {method: 'HEAD', cache: 'no-store'}
      ).then(
        response => ({200: true, 404: false})[response.status]
      )
    ) last++;
    
    if (
      isFinite(+id)
      && (id < 1 || id > last)
    ) {
      setTimeout(() => state[msg.channel.id].inProgress = false, 0);
      
      return "Invalid Pokey the Penguin Archive #";
    }
    
    if (
      !id
      || !isFinite(+id)
    ) id = last;
    
    if (msg instanceof Message || msg instanceof CommandInteraction) {
      if (state[msg.channel.id]?.lastMessageID) {
        const disabledComponents =
          await (
            msg.channel.getMessage
            ? msg.channel.getMessage(state[msg.channel.id].lastMessageID)
            : (
              bot.getMessage(
                msg.channel.id,
                state[msg.channel.id].lastMessageID
              )
            )
          ).then(
            message => {
              message.components[0].components.forEach(component => {
                component.disabled = true;
                component.style = Constants.ButtonStyles.SECONDARY;
              });
              return message.components;
            }
          )
        ;
        
        await (
          msg.channel.editMessage
          ? (
            msg.channel.editMessage(
              state[msg.channel.id].lastMessageID,
              { components: disabledComponents }
            )
          )
          : (
            bot.editMessage(
              msg.channel.id,
              state[msg.channel.id].lastMessageID,
              { components: disabledComponents }
            )
          )
        );
      }
    }
    
    state[msg.channel.id].id = id;
    
    if (content) {
      message.content = content;
    }
    
    message.embeds = [
      {
        author: {
          name: "Pokey the Penguin",
          url: "http://yellow5.com/pokey/"
        },
        color: 0x000000
      }
    ];
    
    const embed = message.embeds[0];
    
    embed.title = `Pokey the Penguin (#${id})`;
    embed.url = `http://yellow5.com/pokey/archive/index${id}.html`;
    
    embed.image = { url: `http://yellow5.com/pokey/archive/pokey${id}.gif` };
    
    message.components = [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.BUTTON,
            style: Constants.ButtonStyles.PRIMARY,
            custom_id: "pokeyFirst",
            label: "|<",
            disabled: false,
            /*
            style: id > 1
              ? Constants.ButtonStyles.PRIMARY
              : Constants.ButtonStyles.SECONDARY
            ,
            disabled: id > 1
              ? false
              : true
            ,
            */
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            style: id > 1
              ? Constants.ButtonStyles.PRIMARY
              : Constants.ButtonStyles.SECONDARY
            ,
            custom_id: "pokeyPrev",
            label: "<",
            disabled: id > 1
              ? false
              : true
            ,
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            style: Constants.ButtonStyles.PRIMARY,
            custom_id: "pokeyRandom",
            label: "Random",
            disabled: false,
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            style: id < last
              ? Constants.ButtonStyles.PRIMARY
              : Constants.ButtonStyles.SECONDARY
            ,
            custom_id: "pokeyNext",
            label: ">",
            disabled: id < last
              ? false
              : true
            ,
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            style: Constants.ButtonStyles.PRIMARY,
            custom_id: "pokeyLast",
            label: ">|",
            disabled: false,
            /*
            style: id < latest
              ? Constants.ButtonStyles.PRIMARY
              : Constants.ButtonStyles.SECONDARY
            ,
            disabled: id < latest
              ? false
              : true
            ,
            */
          },
        ],
      },
    ];
    
    setTimeout(() => state[msg.channel.id].inProgress = false, 0);
    
    return message;
  } catch (err) {
    setTimeout(() => state[msg.channel.id].inProgress = false, 0);
    
    logMessage(`Error processing Pokey the Penguin archive number ${id}`);
    logException(err);
  }
}

module.exports = pokeyQuery;
