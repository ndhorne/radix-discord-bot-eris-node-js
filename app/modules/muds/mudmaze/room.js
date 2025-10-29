/*
Copyright (C) 2024, 2025 Nicholas D. Horne

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

const { Message, CommandInteraction } = require("eris");

const relay = require("./relay.js");

const getUser = require("../../helpers/getuser.js");
const getDMChannel = require("../../helpers/getdmchannel.js");
const print = require("../../helpers/print.js");

class Exits {
  constructor(exits) {
    const validDirs = [
      "n", "ne", "e", "se", "s", "sw", "w", "nw", "u", "d"
    ];
    
    if (!Object.keys(exits).every((dir) => validDirs.includes(dir))) {
      throw new Error("Invalid exit direction");
    }
    
    Object.keys(exits).forEach((dir) => {
      if (exits[dir].dest) {
        const dest = exits[dir].dest;
        
        if (!maze.isValidDestinationForm(dest)) {
          throw new Error("Invalid destination form");
        }
        
        if (!maze.isValidDestinationRange(dest)) {
          throw new Error("Invalid destination range");
        }
      }
    });
    
    Object.assign(this, exits);
  }
  
  toString() {
    const exitsArr = [];
    
    let str = "";
    
    if ({}.hasOwnProperty.call(this, "n")) exitsArr.push("north");
    if ({}.hasOwnProperty.call(this, "ne")) exitsArr.push("northeast");
    if ({}.hasOwnProperty.call(this, "e")) exitsArr.push("east");
    if ({}.hasOwnProperty.call(this, "se")) exitsArr.push("southeast");
    if ({}.hasOwnProperty.call(this, "s")) exitsArr.push("south");
    if ({}.hasOwnProperty.call(this, "sw")) exitsArr.push("southwest");
    if ({}.hasOwnProperty.call(this, "w")) exitsArr.push("west");
    if ({}.hasOwnProperty.call(this, "nw")) exitsArr.push("northwest");
    if ({}.hasOwnProperty.call(this, "u")) exitsArr.push("up");
    if ({}.hasOwnProperty.call(this, "d")) exitsArr.push("down");
    
    if (exitsArr.length > 1) {
      const lastIndex = exitsArr.length - 1;
      
      exitsArr[lastIndex] = `and ${exitsArr[lastIndex]}`;
    }
    
    str += exitsArr.length > 1 ? "Exits lead " : "An exit leads ";
    
    str += exitsArr.length > 2 ? exitsArr.join(", ") : exitsArr.join(" ");
    
    str += ".";
    
    return str;
  }
}

class OccupantsArray extends Array {
  filter(cb, thisArg) {
    const room = this.room;
    const arr = Array.prototype.filter.call(this, cb, thisArg);
    arr.room = room;
    return arr;
  }
  
  map(cb, thisArg) {
    const room = this.room;
    const arr = Array.prototype.map.call(this, cb, thisArg);
    arr.room = room;
    return arr;
  }
}

class PlayerOccupantsArray extends OccupantsArray {
  getPlayersByUsername(username) {
    username = username.toLowerCase();
    
    const matches = this.filter((user) => {
      return user.username.toLowerCase().includes(username);
    });
    
    return matches;
  }
  
  toString() {
    if (this.length > 0) {
      return this.reduce((str, user, index, arr) => {
        const isAway = this.room.maze.mud.players[user.id].flags.isAway;
        
        if (arr.length !== 1 && index === arr.length - 1) str += " and ";
        str += user.username + (isAway ? " (away)" : "");
        if (arr.length > 2 && index < arr.length - 1) str += ", ";
        return str;
      }, "") + (this.length > 1 ? " are" : " is") + " here.";
    } else {
      return "No one is here.";
    }
  }
}

class MobileObjectOccupantsArray extends OccupantsArray {
  toString() {
    if (this.length > 0) {
      return this.reduce((str, mob, index, arr) => {
        if (arr.length !== 1 && index === arr.length - 1) str += " and ";
        str += (index === 0 ? "A " : "a ") + mob.kind;
        if (arr.length > 2 && index < arr.length - 1) str += ", ";
        return str;
      }, "") + (this.length > 1 ? " are" : " is") + " here.";
    } else {
      return "";
    }
  }
}

class Occupants {
  constructor(room) {
    Object.defineProperty(this, "room", {
      value: room,
      enumerable: false,
    });
  }
  
  toArray() {
    const arr = Object.keys(this).map((key) => this[key]);
    arr.room = this.room;
    return arr;
  }
}

class PlayerOccupants extends Occupants {
  toArray() {
    const arr = new PlayerOccupantsArray(...super.toArray());
    arr.room = this.room;
    return arr;
  }
}

class MobileObjectOccupants extends Occupants {
  toArray() {
    const arr = new MobileObjectOccupantsArray(...super.toArray());
    arr.room = this.room;
    return arr;
  }
}

class Room {
  constructor({ x, y, z }, name, desc, exits, maze) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.name = name;
    this.desc = desc;
    this.exits = new Exits(exits);
    this.players = new PlayerOccupants(this);
    this.mobs = new MobileObjectOccupants(this);
    this.maze = maze;
    this.index = x + this.maze.details.width * y;
  }
  
  static isRoom(room) {
    return room instanceof this;
  }
  
  exit(msg, options = {}) {
    const MobileObject = require("./mobileobject.js");
    const Player = require("./player.js");
    
    const mobs = this.mobs.toArray();
    let entity, playerData;
    
    if (msg instanceof Message || options.entity instanceof Player) {
      entity = msg instanceof Message ? getUser(msg) : options.entity.userObj;
      playerData = this.maze.mud.players[entity.id];
      
      delete this.players[entity.id];
    } else if (options.entity instanceof MobileObject) {
      entity = options.entity;
      
      delete this.mobs[entity.id];
    } else {
      throw new Error("Unknown entity");
    }
    
    const players = this.players.toArray();
    
    if (players.length > 0 && options.toDir) {
      relay(
        players,
        (
          playerData
          ? entity.username
          : `A ${entity.kind}`
        )
        + ` exits to the ${options.toDir}.`
      );
    }
    
    if (playerData && !options.isTeleport) {
      if (mobs.length > 0) {
        for (let mob of mobs) {
          if (mob.onPlayerExit) {
            setTimeout(
              (playerData) => mob.onPlayerExit(playerData),
              0,
              playerData
            );
          }
        }
      }
    }
  }
  
  async enter(msg, options) {
    const MobileObject = require("./mobileobject.js");
    const Player = require("./player.js");
    
    const level = this.z;
    const room = this.index;
    const width = this.maze.details.width;
    const players = this.players.toArray();
    const mobs = this.mobs.toArray();
    let entity, playerData, channel;
    
    if (
      options.entity instanceof Player
      || msg instanceof Message
      || msg instanceof CommandInteraction
    ) {
      entity = (
        options.entity instanceof Player
        ? options.entity.userObj
        : getUser(msg)
      );
      
      channel = (
        options.entity instanceof Player
        ? await getDMChannel(options.entity.userObj.id)
        : msg.channel
      );
      
      playerData = this.maze.mud.players[entity.id];
      //playerData.history.room.push(this);
    } else if (options.entity instanceof MobileObject) {
      entity = options.entity;
    } else {
      throw new Error("Unknown entity");
    }
    
    if (players.length > 0 && options.fromDir) {
      relay(
        players,
        (playerData ? entity.username : `A ${entity.kind}`)
        + ` enters from the ${options.fromDir}.`
      );
    }
    
    if (playerData) {
      const desc = (
        (
          playerData.flags.isJoin
          ? (
            `Welcome to ${this.maze.mud.name}! `
            + this.maze.mud.desc
            + " Type \`help\` for help!\n"
          )
          : ""
        )
        + (
          (playerData.flags.isCaptive && this.maze.mud.strings.captiveText)
          ? (
            `**${this.getName()}**\n`
            + this.maze.mud.strings.captiveText
            + " "
            + this.getDesc()
          )
          : this.toString()
        )
        + (players.length > 0 ? ` ${players.toString()}` : "")
        + (mobs.length > 0 ? ` ${mobs.toString()}` : "")
      );
      
      print(channel, desc);
    }
    
    if (this.maze.details.footsteps) {
      let adjacentRooms = [];
      
      if (room % width !== 0) {
        if (room - (width + 1) >= 0) {
          adjacentRooms.push({
            level: level,
            room: room - (width + 1),
            fromDir: "southeast",
          });
        }
        
        adjacentRooms.push({
          level: level,
          room: room - 1,
          fromDir: "east",
        });
        
        if (room + (width - 1) < this.maze.grid[level].length) {
          adjacentRooms.push({
            level: level,
            room: room + (width - 1),
            fromDir: "northeast",
          });
        }
      }
      
      if (room - width >= 0) {
        adjacentRooms.push({
          level: level,
          room: room - width,
          fromDir: "south",
        });
      }
      
      if (room % width !== width - 1) {
        if (room - (width - 1) >= 0) {
          adjacentRooms.push({
            level: level,
            room: room - (width - 1),
            fromDir: "southwest",
          });
        }
        
        adjacentRooms.push({
          level: level,
          room: room + 1,
          fromDir: "west",
        });
        
        if (room + (width + 1) < this.maze.grid[level].length) {
          adjacentRooms.push({
            level: level,
            room: room + (width + 1),
            fromDir: "northwest",
          });
        }
      }
      
      if (room + width < this.maze.grid[level].length) {
        adjacentRooms.push({
          level: level,
          room: room + width,
          fromDir: "north",
        });
      }
      
      if (level + 1 < this.maze.grid.length) {
        adjacentRooms.push({
          level: level + 1,
          room: room,
          fromDir: "room below",
        });
      }
      
      if (level - 1 >= 0) {
        adjacentRooms.push({
          level: level - 1,
          room: room,
          fromDir: "room above",
        });
      }
      
      const pos = playerData ? playerData.position : entity.position;
      const stepSound = (
        options?.stepSound
        ? options.stepSound
        : (
          playerData
          ? playerData.stepSound
          : entity.stepSound
        )
      );
      
      adjacentRooms.filter(({ level, room }) => {
        if (level === pos.level) {
          return room !== pos.room;
        } else {
          return true;
        }
      }).forEach(({ level, room, fromDir }) => {
        const roomObj = this.maze.getRoom({ level, room });
        
        if (Room.isRoom(roomObj)) {
          const players = roomObj.players.toArray();
          
          if (players.length > 0) {
            relay(
              players,
              `You hear ${stepSound} from the ${fromDir}.`
            );
          }
        }
      });
    }
    
    if (playerData) {
      playerData.position = { level, room };
      playerData.automap[level][room] = true;
      
      this.players[entity.id] = entity;
      
      if (mobs.length > 0) {
        for (let mob of mobs) {
          if (mob.onPlayerEnter) {
            setTimeout(
              (playerData) => mob.onPlayerEnter(playerData),
              0,
              playerData
            );
          }
        }
      }
      
      playerData.flags.isCaptive = false;
      
      const prevRoom = playerData.history.room.slice(-1)[0];
      const exclusions = (
        prevRoom
        ? (
          [
            {
              level: prevRoom.z,
              room: prevRoom.index,
            },
          ]
        )
        : undefined
      );
      
      this.printAdjacentRoomStepSounds(
        channel,
        { exclusions }
      );
      
      playerData.history.room.push(this);
      //this.maze.mud.players[entity.id].moves++;
    } else {
      entity.position = { level, room };
      this.mobs[entity.id] = entity;
    }
  }
  
  getAdjacentRooms() {
    const level = this.z;
    const room = this.index;
    const width = this.maze.details.width;
    
    let adjacentRooms = [];
    
    if (room % width !== 0) {
      if (room - (width + 1) >= 0) {
        adjacentRooms.push({
          level: level,
          room: room - (width + 1),
          fromDir: "northwest",
        });
      }
      
      adjacentRooms.push({
        level: level,
        room: room - 1,
        fromDir: "west",
      });
      
      if (room + (width - 1) < this.maze.grid[level].length) {
        adjacentRooms.push({
          level: level,
          room: room + (width - 1),
          fromDir: "southwest",
        });
      }
    }
    
    if (room - width >= 0) {
      adjacentRooms.push({
        level: level,
        room: room - width,
        fromDir: "north",
      });
    }
    
    if (room % width !== width - 1) {
      if (room - (width - 1) >= 0) {
        adjacentRooms.push({
          level: level,
          room: room - (width - 1),
          fromDir: "northeast",
        });
      }
      
      adjacentRooms.push({
        level: level,
        room: room + 1,
        fromDir: "east",
      });
      
      if (room + (width + 1) < this.maze.grid[level].length) {
        adjacentRooms.push({
          level: level,
          room: room + (width + 1),
          fromDir: "southeast",
        });
      }
    }
    
    if (room + width < this.maze.grid[level].length) {
      adjacentRooms.push({
        level: level,
        room: room + width,
        fromDir: "south",
      });
    }
    
    if (level + 1 < this.maze.grid.length) {
      adjacentRooms.push({
        level: level + 1,
        room: room,
        fromDir: "room below",
      });
    }
    
    if (level - 1 >= 0) {
      adjacentRooms.push({
        level: level - 1,
        room: room,
        fromDir: "room above",
      });
    }
    
    return adjacentRooms;
  }
  
  getAdjacentOccupiedRooms() {
     return this.getAdjacentRooms().filter(({ level, room }) => {
      const roomObj = this.maze.getRoom({ level, room });
      
      if (Room.isRoom(roomObj)) {
        const mobs = roomObj.mobs.toArray();
        const players = roomObj.players.toArray();
        
        if (mobs.length > 0 || players.length > 0) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    });
  }
  
  printAdjacentRoomStepSounds(channel, options) {
    let adjacentOccupiedRooms = this.getAdjacentOccupiedRooms();
    
    if (options) {
      if (options.exclusions) {
        options.exclusions.forEach(
          ({ level: excludedLevel, room: excludedRoom }) => {
            adjacentOccupiedRooms = adjacentOccupiedRooms.filter(
              ({ level, room }) => {
                return !(level === excludedLevel && room === excludedRoom);
              }
            );
          }
        );
      }
    }
    
    adjacentOccupiedRooms.forEach(({ level, room, fromDir }) => {
      const roomObj = this.maze.getRoom({ level, room });
      
      if (Room.isRoom(roomObj)) {
        const mobs = roomObj.mobs.toArray();
        const players = roomObj.players.toArray();
        
        if (mobs.length > 0) {
          mobs.forEach((mob) => {
            print(
              channel,
              `You hear ${mob.stepSound} from the ${fromDir}.`
            );
          });
        }
        
        if (players.length > 0) {
          players.forEach((player) => {
            print(
              channel,
              `You hear ${player.stepSound} from the ${fromDir}.`
            );
          });
        }
      }
    });
  }
  
  getAdjacentRoomDestinationData(dir) {
    const width = this.maze.details.width;
    let level = this.z;
    let room = this.index;
    let fromDir;
    
    switch (dir) {
      case "n":
        room -= width;
        fromDir = "south";
        break;
      
      case "ne":
        room -= width - 1;
        fromDir = "southwest";
        break;
      
      case "e":
      room += 1;
        fromDir = "west";
        break;
      
      case "se":
        room += width + 1;
        fromDir = "northwest";
        break;
      
      case "s":
        room += width;
        fromDir = "north";
        break;
      
      case "sw":
        room += width - 1;
        fromDir = "northeast";
        break;
      
      case "w":
        room -= 1;
        fromDir = "east";
        break;
      
      case "nw":
        room -= width + 1;
        fromDir = "southeast";
        break;
      
      case "u":
        level += 1;
        fromDir = "level below";
        break;
      
      case "d":
        level -= 1;
        fromDir = "level above";
        break;
      
      default:
        throw new Error("Invalid direction");
      //end cases
    }
    
    return { position: { level, room }, fromDir };
  }
  
  getAdjacentRoomLongDirections({ level, room }) {
    if (
      typeof level !== "number"
      || typeof room !== "number"
      || level < 0
      || level >= this.maze.grid.length
      || room < 0
      || room >= this.maze.grid[level].length
    ) throw new Error("Invalid position");
    
    const levelDifference = this.z - level;
    const roomDifference = this.index - room;
    const width = this.maze.details.width;
    
    let toDir, fromDir;
    
    if (levelDifference === 0) {
      if (roomDifference === width + 1) {
        toDir = "northwest";
        fromDir = "southeast";
      }
      if (roomDifference === width) {
        toDir = "north";
        fromDir = "south";
      }
      if (roomDifference === width - 1) {
        toDir = "northeast";
        fromDir = "southwest";
      }
      if (roomDifference === 1) {
        toDir = "west";
        fromDir = "east";
      }
      if (roomDifference === -1) {
        toDir = "east";
        fromDir = "west";
      }
      if (roomDifference === -width + 1) {
        toDir = "southwest";
        fromDir = "northeast";
      }
      if (roomDifference === -width) {
        toDir = "south";
        fromDir = "north";
      }
      if (roomDifference === -width - 1) {
        toDir = "southeast";
        fromDir = "northwest";
      }
    } else {
      if (roomDifference === 0) {
        if (levelDifference === 1) {
          toDir = "level above";
          fromDir = "level below";
        }
        if (levelDifference === -1) {
          toDir = "level below";
          fromDir = "level above";
        }
      }
    }
    
    return { toDir, fromDir };
  }
  
  getName() {
    const numberOfExits = Object.keys(this.exits).length;
    
    let name = this.name;
    
    if (!name) {
      if (
        this.z === this.maze.details.spawn.level
        && this.index === this.maze.details.spawn.room
      ) {
        name = "Spawn";
      } else if (numberOfExits === 1) {
        name = "Dead End";
      } else {
        name = this.maze.details.defaults.room.name;
      }
    }
    
    return name;
  }
  
  getDesc() {
    const exits = this.exits;
    const numberOfExits = Object.keys(this.exits).length;
    
    let desc = this.desc;
    
    if (!desc) {
      if (numberOfExits > 1) {
        const defaultDesc = this.maze.details.defaults.room.desc;
        
        desc = defaultDesc ? defaultDesc : "";
      } else {
        desc = "You have reached a dead end.";
      }
      
      desc += ` ${exits.toString()}`;
    }
    
    return desc;
  }
  
  toString() {
    const name = this.getName();
    const desc = this.getDesc();
    
    let str = "";
    
    if (name) str += `**${name}**\n`;
    
    str += desc;
    
    return str;
  }
}

module.exports = Room;
