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
const random = require("../../../helpers/random.js");
const getUser = require("../../../helpers/getuser.js");

const { logMessage, logException } = require("../../../helpers/loggers.js");

const bot = global.bot;
const state = global.states.galleries.met;
const whitelist = global.whitelists.galleries.met;

async function metQuery(msg, args) {
  if (!isDM(msg) && !whitelist.includes(msg.channel.id)) {
    return "Channel not whitelisted for gallery The Met!";
  }
  
  if (!state[msg.channel.id]) state[msg.channel.id] = Object.create(null);
  
  state[msg.channel.id].inProgress = true;
  
  let obj, id = args[0];
  
  const user = getUser(msg);
  
  let content = `${user.username} queries The Met!`;
  
  if (msg instanceof ComponentInteraction && args[1]) content += ` ${args[1]}`;
  
  const iconUrl = "https://www.metmuseum.org/content/img/presentation/icons/favicons/favicon-32x32.png";
  
  async function getObj(id) {
    return await fetch(
      `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
    ).then(response => response.json());
  }
  
  function format(str, maxLength) {
    function isCapitalized(str) {
      return /[A-Z]/.test(str[0]);
    }
    
    function capitalize(str) {
      return str[0].toUpperCase() + str.slice(1);
    }
    
    function shorten(str, maxLength, delimiter = " ") {
      while (str.length > maxLength - 3) {
        str = str.split(delimiter).slice(0, -1).join(delimiter);
      }
      
      str += "...";
      
      return str;
    }
    
    if (typeof maxLength === "string") {
      switch (maxLength) {
        case "title": maxLength = 256; break;
        case "desc": maxLength = 4096; break;
        case "fieldname": maxLength = 256; break;
        case "fieldvalue": maxLength = 1024; break;
        case "footer": maxLength = 2048; break;
        case "author": maxLength = 256; break;
        default: throw new Error("Invalid maxLength string value");
      }
    }
    
    if (!isCapitalized(str) && !(str.startsWith("ca.") || str === "n.d.")) {
      str = capitalize(str);
    }
    
    if (str.length > maxLength) {
      str = shorten(str, maxLength);
    }
    
    return str;
  }
  
  try {
    const total = await fetch(
      "https://collectionapi.metmuseum.org/public/collection/v1/objects"
    ).then(response => response.json()).then(result => result.total);
    
    if (
      isFinite(+id)
      && (id < 1 || id > total)
    ) {
      setTimeout(() => state[msg.channel.id].inProgress = false, 0);
      
      return "Invalid Met Object ID";
    }
    
    if (
      !id
      || !isFinite(+id)
    ) {
      do {
        id = Math.floor(random() * total) + 1;
        
        obj = await getObj(id);
      } while (
        !obj.primaryImage
      );
    } else {
      obj = await getObj(id);
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
    
    state[msg.channel.id].id = id;
    
    const message = {
      embeds: [
        {
          author: {
            name: "The Met",
            url: "https://www.metmuseum.org",
            icon_url: iconUrl
          },
          color: 0xef2330
        }
      ]
    };
    
    if (content) {
      message.content = content;
    }
    
    const embed = message.embeds[0];
    
    if (
      obj.message && obj.message === "ObjectID not found"
    ) embed.title = obj.message;
    
    if (obj.title) {
      embed.title = format(obj.title, "title");
    
      if (obj.objectURL) embed.url = obj.objectURL;
    }
    
    if (
      obj.artistDisplayName
      || obj.department
      || obj.period
      || obj.medium
      || obj.objectDate
      || obj.rightsAndReproduction
      || obj.accessionNumber
      || obj.accessionYear
      || obj.objectID
      //|| obj.objectBeginDate
      //|| obj.objectEndDate
      //|| obj.isPublicDomain
    ) { 
      embed.fields = [];
      
      if (obj.artistDisplayName) {
        embed.fields.push(
          {
            name: "Artist",
            value: format(
              obj.artistDisplayName + (
                obj.artistDisplayBio
                ? ` (${obj.artistDisplayBio})`
                : obj.artistBeginDate && obj.artistEndDate
                ? ` (${obj.artistBeginDate}-${obj.artistEndDate})`
                : ""
              ), "fieldvalue"
            )
          }
        );
      }
      
      if (obj.department) {
        embed.fields.push(
          {
            name: "Department",
            value: format(obj.department, "fieldvalue")
          }
        );
      }
      
      if (obj.period) {
        embed.fields.push(
          {
            name: "Period",
            value: format(obj.period, "fieldvalue")
          }
        );
      }
      
      if (obj.medium) {
        embed.fields.push(
          {
            name: "Medium",
            value: format(obj.medium, "fieldvalue")
          }
        );
      }
      
      if (obj.objectDate) {
        embed.fields.push(
          {
            name: "Date",
            value: format(obj.objectDate, "fieldvalue")
          }
        );
      }
      
      if (obj.rightsAndReproduction) {
        embed.fields.push(
          {
            name: "Rights",
            value: format(obj.rightsAndReproduction, "fieldvalue")
          }
        );
      }
      
      if (obj.accessionYear) {
        embed.fields.push(
          {
            name: "Acquired",
            value: obj.accessionYear,
            inline: true
          }
        );
      }
      
      if (obj.accessionNumber) {
        embed.fields.push(
          {
            name: "Accession #",
            value: obj.accessionNumber,
            inline: true
          }
        );
      }
      
      if (obj.objectID) {
        embed.fields.push(
          {
            name: "ID",
            value: obj.objectID,
            inline: true
          }
        );
      }
      
      /*
      if (obj.objectBeginDate && obj.objectEndDate) {
        embed.fields.push(
          {
            name: "Started",
            value: obj.objectBeginDate,
            inline: true
          }
        );
        
        embed.fields.push(
          {
            name: "Completed",
            value: obj.objectEndDate,
            inline: true
          }
        );
      }
      */
      
      /*
      if (obj.isPublicDomain) {
        embed.fields.push(
          {
            name: "Public Domain",
            value: String(obj.isPublicDomain),
            inline: true
          }
        );
      }
      */
    }
    
    if (obj.primaryImage) {
      if ((await fetch(obj.primaryImage)).ok) {
        embed.image = {
          url: obj.primaryImage
        };
      } else if (obj.additionalImages.length > 0) {
        for (const image of obj.additionalImages) {
          if ((await fetch(image)).ok) {
            embed.image = {
              url: image
            };
            break;
          }
        }
      }
    }
    
    /*
    if (obj.primaryImageSmall) {
      embed.thumbnail = {
        url: obj.primaryImageSmall
      };
    }
    */
    
    if (obj.repository) {
      embed.footer = {
        text: format(obj.repository, "footer"),
        icon_url: iconUrl
      };
    }
    
    message.components = [
      {
        type: Constants.ComponentTypes.ACTION_ROW,
        components: [
          {
            type: Constants.ComponentTypes.BUTTON,
            style: Constants.ButtonStyles.PRIMARY,
            custom_id: "metFirst",
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
            custom_id: "metPrev",
            label: "<",
            disabled: id > 1
              ? false
              : true
            ,
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            style: Constants.ButtonStyles.PRIMARY,
            custom_id: "metRandom",
            label: "Random",
            disabled: false,
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            style: id < total
              ? Constants.ButtonStyles.PRIMARY
              : Constants.ButtonStyles.SECONDARY
            ,
            custom_id: "metNext",
            label: ">",
            disabled: id < total
              ? false
              : true
            ,
          },
          {
            type: Constants.ComponentTypes.BUTTON,
            style: Constants.ButtonStyles.PRIMARY,
            custom_id: "metLast",
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
    
    logMessage(`Error processing Met Object ID ${id}`);
    logException(err);
  }
}

module.exports = metQuery;
