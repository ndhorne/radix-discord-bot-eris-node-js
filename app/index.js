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

const Eris = require("eris");

const { userInfo } = require("os");

const dir = global.baseDir = __dirname;
const logDir = global.logDir = `/run/user/${userInfo().uid}/radix/logs`;

require("./modules/helpers/checkdir.js")(logDir);

require("dotenv").config({path: `${dir}/.env`});

const bot = global.bot = new Eris.Client(
  `Bot ${process.env.TOKEN}`,
  {
    intents:
      1 //GUILDS
      + 512 //GUILD_MESSAGES
      + 4096 //DIRECT_MESSAGES
      + 32768 //MESSAGE_CONTENT
    ,
    restMode: true,
  },
);

const prefix = global.prefix = process.env.PREFIX;
const shortPrefix = global.shortPrefix = process.env.SHORT_PREFIX;
const shortGuilds = global.shortGuilds = [...new Set(
  [process.env.PRIMARY_GUILD]
  .concat(process.env.SHORT_GUILDS?.split(","))
  .filter(guildID => guildID)
)];

global.owner = process.env.OWNER;
global.admins = [...new Set(
  [global.owner]
  .concat(process.env.ADMINS?.split(","))
  .filter(userID => userID)
)];

const states = global.states = require("./modules/helpers/initstates.js")();

global.data = require("./modules/helpers/initdata.js")();

global.whitelists = require("./modules/helpers/initwhitelists.js")();

global.handlers = require("./modules/helpers/inithandlers.js")();

const initInteractions = require("./modules/helpers/initinteractions.js");

const getPlayArgs = require("./modules/helpers/getplayargs.js");
const invokeHandler = require("./modules/helpers/invokehandler.js");
const validateMessage = require("./modules/helpers/validatemessage.js");
const auditStates = require("./modules/helpers/auditstates.js");

const isDM = require("./modules/helpers/isdm.js");
const print = require("./modules/helpers/print.js");
const getUser = require("./modules/helpers/getuser.js");
const isEphemeral = require("./modules/helpers/isephemeral.js");
const makeMUDMove = require("./modules/helpers/makemudmove.js");
const makeGameMove = require("./modules/helpers/makegamemove.js");
const updateStatus = require("./modules/helpers/updatestatus.js");
const removeMentions = require("./modules/helpers/removementions.js");

const {
  logError,
  logWarning,
  logMessage,
  logException,
  logDebug 
} = require("./modules/helpers/loggers.js");

const debug = false;

let ready, mentionRegex;

global.embedColor = 0x1678c5;

/* moved to module
async function print(channel, result) {
  try {
    if (!channel instanceof Eris.Channel) {
      throw new Error("Invalid channel");
    }
    
    return await bot.createMessage(channel.id, result);
  } catch (err) {
    logException(err);
    
    if (
      err.message.startsWith("Request timed out")
      || err.message.startsWith("503")
    ) {
      print(channel, result);
    }
  }
}
*/

bot.on("messageCreate", async function(msg) {
  try {
    const user = getUser(msg);
    
    if (user.bot || !msg.content) return;
    
    const isMention = msg.mentions.find(
      mentionedUser => mentionedUser.id === bot.user.id
    );
    
    let content = msg.content.toLowerCase().trim();
    
    if (
      msg.channel.id in states.games[Symbol.for("gamesInProgress")]
      && !(prefix && content.startsWith(prefix))
      && !(shortPrefix && content.startsWith(shortPrefix))
    ) {
      if (
        makeGameMove(msg, (isMention ? removeMentions(content) : content))
      ) return;
    }
    
    if (
      isDM(msg)
      && user.id in states.muds[Symbol.for("mudders")]
      && !(prefix && content.startsWith(prefix))
      && !(shortPrefix && content.startsWith(shortPrefix))
    ) {
      if (
        makeMUDMove(msg, (isMention ? removeMentions(content) : content))
      ) return;
    }
    
    if (
      (
        !isMention
        && !(prefix && content.startsWith(prefix))
        && !(shortPrefix && content.startsWith(shortPrefix))
      )
      || (
        (shortPrefix && content.startsWith(shortPrefix))
        && (
          !shortGuilds.includes(msg.guildID)
          && !isDM(msg)
        )
      )
      || (
        isMention && !mentionRegex.test(content)
      )
    ) return;
    
    const parts = content.split(" ").map(str => str.trim()).filter(str => str);
    
    let command, args;
    
    if (
      (isMention && mentionRegex.test(content))
      || (prefix && content.startsWith(prefix))
    ) {
      command = parts[1];
      args = parts.slice(2);
    } else if (shortPrefix && content.startsWith(shortPrefix)) {
      command = parts[0].substr(1);
      args = parts.slice(1);
    }
    
    const result = await invokeHandler(msg, command, args, 1);
    
    if (validateMessage(result)) {
      //const sentMessage = await msg.channel.createMessage(result);
      const sentMessage = await print(msg.channel, result);
      
      auditStates(sentMessage, command, args);
    }
  } catch (err) {
    logException(err);
  }
});

bot.on("interactionCreate", async function(interaction) {
  let args;
  
  try {
    //command interactions
    if (interaction instanceof Eris.CommandInteraction) {
      const command = interaction.data.name;
      const type = interaction.data.type;
      
      await interaction.defer(isEphemeral(command) ? 64 : undefined);
      
      //it's this or refactor every command module (so it's this...)
      if (type === 1) {
        if (command === "play") {
          const gameName = interaction.data.options[0].name;
          const gameOptions = interaction.data.options[0].options;
          
          args = getPlayArgs(gameName, gameOptions);
        } else if (command === "gallery") {
          const galleryName = interaction.data.options[0].name;
          const galleryOptions = interaction.data.options[0].options;
          
          args = [galleryName].concat(galleryOptions.map(arg => arg.value));
        } else if (command === "info" || command === "enter") {
          args = [interaction.data.options[0].name];
        } else {
          args = interaction.data.options?.map(arg => arg.value);
        }
      } else if (type === 2) {
        if (command === "slap") {
          args = [
            interaction.member.user.username,
            interaction.data.resolved.users
              .get(interaction.data.target_id).username
            ,
          ];
        }
      }
      
      const result = await invokeHandler(interaction, command, args, type);
      
      if (validateMessage(result)) {
        //await interaction.createMessage(result);
        await print(interaction, result);
        
        auditStates(interaction, command, args);
      }
      
      return;
    }
    
    function printQueryInProgress() {
      return interaction.createMessage({
        content: "Query in progress",
        flags: 64,
      });
    }
    
    //button interactions
    if (interaction instanceof Eris.ComponentInteraction) {
      //not wordle
      if (interaction.data.custom_id.startsWith("notwordlebutton")) {
        return interaction.acknowledge();
      }
      
      //met
      if (interaction.data.custom_id.startsWith("met")) {
        if (states.galleries.met[interaction.channel.id]?.inProgress) {
          return printQueryInProgress();
        } else {
          await interaction.defer();
          
          require("./modules/interactions/component/met.js")(interaction);
          return;
        }
      }
      
      //angryflower
      if (interaction.data.custom_id.startsWith("angryFlower")) {
        if (states.galleries.angryflower[interaction.channel.id]?.inProgress) {
          return printQueryInProgress();
        } else {
          await interaction.defer();
          
          require("./modules/interactions/component/angryflower.js")(
            interaction
          );
          return;
        }
      }
      
      //pokey
      if (interaction.data.custom_id.startsWith("pokey")) {
        if (states.galleries.pokey[interaction.channel.id]?.inProgress) {
          return printQueryInProgress();
        } else {
          await interaction.defer();
          
          require("./modules/interactions/component/pokey.js")(interaction);
          return;
        }
      }
      
      //xkcd
      if (interaction.data.custom_id.startsWith("xkcd")) {
        if (states.galleries.xkcd[interaction.channel.id]?.inProgress) {
          return printQueryInProgress();
        } else {
          await interaction.defer();
          
          require("./modules/interactions/component/xkcd.js")(interaction);
          return;
        }
      }
    }
  } catch (err) {
    logException(err);
  }
});

bot.once("ready", async function() {
  try {
    mentionRegex = new RegExp(`^<@${bot.user.id}> .+`);
    
    await initInteractions();
  } catch (err) {
    logException(err);
  }
});

bot.on("ready", async function() {
  try {
    ready = true;
    
    updateStatus();
    
    logMessage("All shards ready");
  } catch (err) {
    logException(err);
  }
});

bot.on("connect", async function(id) {
  try {
    logMessage(`Shard ${id} connected`);
  } catch (err) {
    logException(err);
  }
});

bot.on("shardPreReady", async function(id) {
  try {
    logMessage(`Shard ${id} finished processing ready packet`);
  } catch (err) {
    logException(err);
  }
});

bot.on("shardReady", async function(id) {
  try {
    logMessage(`Shard ${id} ready`);
  }  catch (err) {
    logException(err);
  }
});

bot.on("shardResume", async function(id) {
  try {
    logMessage(`Shard ${id} resumed`);
  } catch (err) {
    logException(err);
  }
});

bot.on("shardDisconnect", async function(err, id) {
  try {
    const uptime = bot.uptime.valueOf();
    
    logError(err, id, "shardDisconnect", uptime);
    logMessage(`Shard ${id} disconnected`);
  } catch (err) {
    logException(err);
  } finally {
    try {
      if (id) {
        const shard = bot.shards.get(id.valueOf());
        
        const reconnectInterval = setInterval(() => {
          if (shard.status === "connected") {
            return clearInterval(reconnectInterval);
          } else if (!shard.connecting) {
            shard.connect();
          }
        }, 5000);
      } else {
        bot.connect();
      }
    } catch (err) {
      logException(err);
    }
  }
});

bot.on("disconnect", async function() {
  try {
    ready = false;
    
    logMessage("All shards disconnected");
  } catch (err) {
    logException(err);
  }
});

bot.on("error", async function(err, id) {
  try {
    logError(err, id, "error");
  } catch (err) {
    logException(err);
  }
});

bot.on("warn", async function(msg, id) {
  try {
    logWarning(msg, id);
  } catch (err) {
    logException(err);
  }
});

bot.on("unknown", async function(packet, id) {
  try {
    logMessage(`Shard ${id} received unknown packet: ${packet}`);
  } catch (err) {
    logException(err);
  }
});

bot.on("debug", async function(msg, id) {
  if (debug) {
    try {
      logDebug(msg, id);
    } catch (err) {
      logException(err);
    }
  }
});

bot.connect();
