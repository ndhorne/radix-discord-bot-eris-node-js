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

const getUser = require("../../helpers/getuser.js");

const admins = global.admins;

function getHelp(msg, command, ...args) {
  const user = getUser(msg);
  
  let str = "usage: ";
  
  function setCommandNotFound() {
    str = `Command \`${command}\` not found`;
  }
  
  switch (command) {
    case "n":
    case "north":
      str += `${command}\n`
        + "Go north"
      ;
      break;
      
    case "ne":
    case "northeast":
      str += `${command}\n`
        + "Go northeast"
      ;
      break;
    
    case "e":
    case "east":
      str += `${command}\n`
        + "Go east"
      ;
      break;
    
    case "se":
    case "southeast":
      str += `${command}\n`
        + "Go southeast"
      ;
      break;
    
    case "s":
    case "south":
      str += `${command}\n`
        + "Go south"
      ;
      break;
    
    case "sw":
    case "southwest":
      str += `${command}\n`
        + "Go southwest"
      ;
      break;
    
    case "w":
    case "west":
      str += `${command}\n`
        + "Go west"
      ;
      break;
    
    case "nw":
    case "northwest":
      str += `${command}\n`
        + "Go northwest"
      ;
      break;
    
    case "l":
    case "look":
      str += `${command}\n`
        + "Describe room"
      ;
      break;
    
    case "q":
    case "quit":
      str += `${command}\n`
        + `Quit game`
      ;
      break;
    
    case "h":
    case "help":
      str += `${command} [<command>]\n`
        + "Show help"
      ;
      break;
    
    case "m":
    case "map":
      str += `${command} [<level>]`
        + (admins.includes(user.id) ? " [<username>]" : "")
        + "\n"
        + "Show automap"
        + (
          admins.includes(user.id)
          ? "\n*<username> is case-insensitive, can be partial"
          : ""
        )
      ;
      break;
    
    case "say":
      str += `${command} <dialogue>\n`
        + "Say something to all players in a room"
      ;
      break;
    
    case "tell":
      str += `${command} <username> <dialogue>\n`
        + "Say something to a particular player (in the same room)\n"
        + "*<username> is case-insensitive, can be partial"
      ;
      break;
    
    case "yell":
      str += `${command} <dialogue>\n`
        + "Say something to all players in a room and adjacent rooms"
      ;
      break;
    
    case "away":
      str += `${command} [<message>]\n`
        + "Set/clear away status"
      ;
      break;
    
    case "stats":
      str += `${command}`;
      
      switch (args[0]) {
        case "global":
          str += " global\n"
            + "Query global stats"
          ;
          break;
        
        case "self":
          str += " self\n"
            + "Query self stats"
          ;
          break;
        
        case "player":
          str += " player <username>\n"
            + "Query player stats\n"
            + "*<username> is case-insensitive, can be partial"
          ;
          break;
        
        default:
          str += " {global | self | (player <username>)}\n"
            + "Query game statistics"
          ;
        //end cases
      }
      break;
    
    case "teleport":
      str += `${command} {spawn`
        + (
          admins.includes(user.id)
          ? " | (<level index> <room index>) | (<x> <y> <z>)"
          : ""
        )
        + "}\n"
        + "Teleport to a given destination"
      ;
      break;
    
    case "query":
      if (admins.includes(user.id)) {
        str += `${command} `
        
        switch (args[0]) {
          case "players":
            switch (args[1]) {
              case "online":
                str += "players online\n"
                  + "Query online players"
                ;
                break;
              
              case "offline":
                str += "players offline\n"
                  + "Query offline players"
                ;
                break;
              
              case "all":
                str += "players all\n"
                  + "Query all players to enter maze"
                ;
                break;
              
              default:
                str += "players {online | offline | all}\n"
                  + "Query players"
                ;
              //end cases
            }
            break;
          
          case "coords":
            str += "coords <username>\n"
              + "Query player position\n"
              + "*<username> is case-insensitive, can be partial"
            ;
            break;
          
          default:
            str += "{players | coords}\n"
              + "Query various game details"
            ;
          //end cases
        }
      } else {
        setCommandNotFound();
      }
      break;
      
    case "listen":
      str += "listen\n"
        + "Listen to surrounding rooms"
      ;
      break;
    
    case "debug":
      str += `${command}\n`
        + "Query debug mode"
      ;
      break;
    
    default:
      setCommandNotFound();
    //end cases
  }
  
  return str;
}

module.exports = getHelp;
