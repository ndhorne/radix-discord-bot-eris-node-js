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

function initHandlers() {
  const handlers = {};
  
  handlers.chatInput = {};
  handlers.user = {};
  
  function initChatInputHandler(command, handler) {
    if (typeof handler === "string") {
      handlers.chatInput[command] = require(handler);
    } else if (typeof handler === "function") {
      handlers.chatInput[command] = handler;
    }
  }
  
  function initUserHandler(command, handler) {
    if (typeof handler === "string") {
      handlers.user[command] = require(handler);
    } else if (typeof handler === "function") {
      handlers.user[command] = handler;
    }
  }
  
  initChatInputHandler("roll", "../commands/chat_input/roll.js");
  initChatInputHandler("help", "../commands/chat_input/help.js");
  initChatInputHandler("about", "../commands/chat_input/about.js");
  initChatInputHandler("source", "../commands/chat_input/source.js");
  initChatInputHandler("feedback", "../commands/chat_input/feedback.js");
  initChatInputHandler("enter", "../commands/chat_input/enter.js");
  
  initChatInputHandler("miau", "../commands/chat_input/miau.js");
  initChatInputHandler("hello", "../commands/chat_input/hello.js");
  initChatInputHandler("xyzzy", "../commands/chat_input/xyzzy.js");
  initChatInputHandler("plugh", "../commands/chat_input/plugh.js");
  
  //admin
  initChatInputHandler("logs", "../commands/chat_input/query/logs.js");
  
  //games
  initChatInputHandler("play", "../commands/chat_input/games/play.js");
  initChatInputHandler("join", "../commands/chat_input/games/join.js");
  initChatInputHandler("hint", "../commands/chat_input/games/hint.js");
  initChatInputHandler("start", "../commands/chat_input/games/start.js");
  initChatInputHandler("accept", "../commands/chat_input/games/accept.js");
  initChatInputHandler("concede", "../commands/chat_input/games/concede.js");
  initChatInputHandler("gameover", "../commands/chat_input/games/gameover.js");
  initChatInputHandler(
    "nowplaying", "../commands/chat_input/games/nowplaying.js"
  );
  
  //galleries
  initChatInputHandler("met", "../commands/chat_input/query/met.js");
  initChatInputHandler("pokey", "../commands/chat_input/query/pokey.js");
  initChatInputHandler("xkcd", "../commands/chat_input/query/xkcd.js");
  initChatInputHandler(
    "angryflower", "../commands/chat_input/query/angryflower.js"
  );
  
  //query
  initChatInputHandler("8ball", "../commands/chat_input/query/8ball.js");
  initChatInputHandler("currency", "../commands/chat_input/query/currency.js");
  initChatInputHandler("fortune", "../commands/chat_input/query/fortune.js");
  initChatInputHandler("uptime", "../commands/chat_input/query/uptime.js");
  initChatInputHandler(
    "horoscope", "../commands/chat_input/query/horoscope.js"
  );
  /*
  initChatInputHandler(
    "bash.org", "../commands/chat_input/query/bashdotorg.js"
  );
  */
  
  //utils
  initChatInputHandler("randpass", "../commands/chat_input/utils/randpass.js");
  initChatInputHandler("rot13", "../commands/chat_input/utils/rot13.js");
  
  initUserHandler("slap", "../commands/user/slap.js");
  
  initChatInputHandler("admin", async function(msg, args) {
    switch(args[0]) {
      case "logs":
        return handlers.chatInput["logs"](msg, args.slice(1));
      default:
        return handlers.chatInput["help"](msg, ["admin"]);
      //end cases
    }
  });
  
  initChatInputHandler("games", async function(msg, args) {
    switch(args[0]) {
      case "play":
        return handlers.chatInput["play"](msg, args.slice(1));
      case "join":
        return handlers.chatInput["join"](msg, args.slice(1));
      case "hint":
        return handlers.chatInput["hint"](msg, args.slice(1));
      case "start":
        return handlers.chatInput["start"](msg, args.slice(1));
      case "accept":
        return handlers.chatInput["accept"](msg, args.slice(1));
      case "concede":
        return handlers.chatInput["concede"](msg, args.slice(1));
      case "gameover":
        return handlers.chatInput["gameover"](msg, args.slice(1));
      case "nowplaying":
        return handlers.chatInput["nowplaying"](msg, args.slice(1));
      default:
        return handlers.chatInput["help"](msg, ["games"]);
      //end cases
    }
  });
  
  initChatInputHandler("gallery", async function(msg, args) {
    switch(args[0]) {
      case "met":
        return handlers.chatInput["met"](msg, args.slice(1));
      case "angryflower":
        return handlers.chatInput["angryflower"](msg, args.slice(1));
      case "pokey":
        return handlers.chatInput["pokey"](msg, args.slice(1));
      case "xkcd":
        return handlers.chatInput["xkcd"](msg, args.slice(1));
      default:
        return handlers.chatInput["help"](msg, ["query", "gallery"]);
      //end cases
    }
  });
  
  initChatInputHandler("query", async function(msg, args) {
    switch(args[0]) {
      case "horoscope":
        return handlers.chatInput["horoscope"](msg, args.slice(1));
      case "8ball":
        return handlers.chatInput["8ball"](msg, args.slice(1));
      case "fortune":
        return handlers.chatInput["fortune"](msg, args.slice(1));
      /*
      case "bash.org":
        return handlers.chatInput["bash.org"](msg, args.slice(1));
      */
      case "currency":
        return handlers.chatInput["currency"](msg, args.slice(1));
      case "gallery":
        return handlers.chatInput["gallery"](msg, args.slice(1));
      case "uptime":
        return handlers.chatInput["uptime"](msg, args.slice(1));
      default:
        return handlers.chatInput["help"](msg, ["query"]);
      //end cases
    }
  });
  
  initChatInputHandler("utils", async function(msg, args) {
    switch(args[0]) {
      case "randpass":
        return handlers.chatInput["randpass"](msg, args.slice(1));
      case "rot13":
        return handlers.chatInput["rot13"](msg, args.slice(1));
      default:
        return handlers.chatInput["help"](msg, ["utils"]);
      //end cases
    }
  });
  
  initChatInputHandler("info", async function(msg, args) {
    switch(args[0]) {
      case "about":
        return handlers.chatInput["about"](msg, args.slice(1));
      case "source":
        return handlers.chatInput["source"](msg, args.slice(1));
      case "uptime":
        return handlers.chatInput["uptime"](msg, args.slice(1));
      default:
        return handlers.chatInput["help"](msg, ["info"]);
      //end cases
    }
  });
  
  return handlers;
}

module.exports = initHandlers;
