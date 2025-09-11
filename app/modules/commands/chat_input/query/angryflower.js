/*
Copyright (C) 2023, 2024, 2025 Nicholas D. Horne

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

const { parse } = require("node-html-parser");

const isDM = require("../../../helpers/isdm.js");
const random = require("../../../helpers/random.js");
const getUser = require("../../../helpers/getuser.js");

const { logMessage, logException } = require("../../../helpers/loggers.js");

const bot = global.bot;
const state = global.states.galleries.angryflower;
const whitelist = global.whitelists.galleries.angryflower;

async function angryFlowerQuery(msg, args) {
  if (!isDM(msg) && !whitelist.includes(msg.channel.id)) {
    return "Channel not whitelisted for gallery Bob the Angry Flower!";
  }
  
  if (!state[msg.channel.id]) state[msg.channel.id] = Object.create(null);
  
  state[msg.channel.id].inProgress = true;
  
  let id = args[0], last = 1625; //latest comic at the time of this writing
  
  const user = getUser(msg);
  
  let content = `${user.username} queries Bob the Angry Flower!`;
  
  if (msg instanceof ComponentInteraction && args[1]) content += ` ${args[1]}`;
  
  const message = Object.create(null);
  
  try {
    while (
      await fetch(
        `http://angryflower.com/${last + 1}.html`,
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
      
      return "Invalid Bob the Angry Flower #";
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
    
    state[msg.channel.id] = { id: id };
    
    if (content) {
      message.content = content;
    }
    
    message.embeds = [
      {
        author: {
          name: "Bob the Angry Flower",
          url: "http://angryflower.com"
        },
        color: 0xf2ee69
      }
    ];
    
    const embed = message.embeds[0];
    
    embed.title = `Bob the Angry Flower (#${id})`;
    embed.url = `http://angryflower.com/${id}.html`;
    
    const root = parse(
      await (await fetch(`http://angryflower.com/${id}.html`)).text()
    );
    const imgElement = root.querySelector("img");
    const fileName = imgElement.rawAttrs.split(" ")
      .find(attr => attr.startsWith("src="))
      .slice(5, -1)
    ;
    
    embed.image = { url: `http://angryflower.com/${fileName}` };
    
    message.components = [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.BUTTON,
            style: Constants.ButtonStyles.PRIMARY,
            custom_id: "angryFlowerFirst",
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
            custom_id: "angryFlowerPrev",
            label: "<",
            disabled: id > 1
              ? false
              : true
            ,
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            style: Constants.ButtonStyles.PRIMARY,
            custom_id: "angryFlowerRandom",
            label: "Random",
            disabled: false,
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            style: id < last
              ? Constants.ButtonStyles.PRIMARY
              : Constants.ButtonStyles.SECONDARY
            ,
            custom_id: "angryFlowerNext",
            label: ">",
            disabled: id < last
              ? false
              : true
            ,
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            style: Constants.ButtonStyles.PRIMARY,
            custom_id: "angryFlowerLast",
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
    
    logMessage(`Error processing Bob the Angry Flower number ${id}`);
    logException(err);
  }
}

module.exports = angryFlowerQuery;

