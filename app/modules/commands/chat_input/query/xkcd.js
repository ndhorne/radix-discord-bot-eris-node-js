/*
Copyright (C) 2022, 2023, 2024 Nicholas D. Horne

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
const getUser = require("../../../helpers/getuser.js");
//const random = require("../../../helpers/random.js");

const { logMessage, logException } = require("../../../helpers/loggers.js");

const bot = global.bot;
const state = global.states.galleries.xkcd;
const whitelist = global.whitelists.galleries.xkcd;

async function xkcdQuery(msg, args) {
  if (!isDM(msg) && !whitelist.includes(msg.channel.id)) {
    return "Channel not whitelisted for gallery xkcd!";
  }
  
  if (!state[msg.channel.id]) state[msg.channel.id] = Object.create(null);
  
  state[msg.channel.id].inProgress = true;
  
  let id = args[0];
  
  const user = getUser(msg);
  
  let content = `${user.username} queries xkcd!`;
  
  if (msg instanceof ComponentInteraction && args[1]) content += ` ${args[1]}`;
  
  const message = Object.create(null);
  
  try {
    if (id === "404") return "#404 Not Found";
    
    const latest = await fetch(
      "https://xkcd.com/info.0.json"
    ).then(response => response.json()).then(result => result.num);
    
    if (
      isFinite(+id)
      && (id < 1 || id > latest)
    ) {
      setTimeout(() => state[msg.channel.id].inProgress = false, 0);
      
      return "Invalid xkcd #";
    }
    
    if (
      !id
      || !isFinite(+id)
    ) {
      id = latest;
      
      /*
      do {
        id = Math.floor(random() * latest) + 1;
      } while (id === 404);
      */
    }
    
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
    
    const obj = await fetch(
      `https://xkcd.com/${id}/info.0.json`
    ).then(response => response.json());
    
    if (content) {
      message.content = content;
    }
    
    message.embeds = [
      {
        author: {
          name: "xkcd",
          url: "https://xkcd.com"
        },
        color: 0x96a8c8
      }
    ];
    
    const embed = message.embeds[0];
    
    if (obj.title) {
      embed.title = obj.title + (obj.num ? ` (#${obj.num})` : "");
      embed.url = `https://xkcd.com/${obj.num}/`;
    }
    
    if (obj.alt) embed.description = obj.alt;
    
    if (obj.month && obj.day && obj.year) {
      let month;
      
      switch (obj.month) {
        case "1": month = "January"; break;
        case "2": month = "February"; break;
        case "3": month = "March"; break;
        case "4": month = "April"; break;
        case "5": month = "May"; break;
        case "6": month = "June"; break;
        case "7": month = "July"; break;
        case "8": month = "August"; break;
        case "9": month = "September"; break;
        case "10": month = "October"; break;
        case "11": month = "November"; break;
        case "12": month = "December"; break;
        default: throw new Error("Invalid month value");
      }
      
      embed.fields = [];
      
      embed.fields.push(
        {
          name: "Date",
          value: `${obj.day} ${month} ${obj.year}`
        }
      );
    }
    
    if (obj.img) embed.image = { url: obj.img };
    
    message.components = [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.BUTTON,
            style: Constants.ButtonStyles.PRIMARY,
            custom_id: "xkcdFirst",
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
            custom_id: "xkcdPrev",
            label: "<",
            disabled: id > 1
              ? false
              : true
            ,
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            style: Constants.ButtonStyles.PRIMARY,
            custom_id: "xkcdRandom",
            label: "Random",
            disabled: false,
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            style: id < latest
              ? Constants.ButtonStyles.PRIMARY
              : Constants.ButtonStyles.SECONDARY
            ,
            custom_id: "xkcdNext",
            label: ">",
            disabled: id < latest
              ? false
              : true
            ,
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            style: Constants.ButtonStyles.PRIMARY,
            custom_id: "xkcdLast",
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
    
    logMessage(`Error processing xkcd number ${id}`);
    logException(err);
  }
}

module.exports = xkcdQuery;
