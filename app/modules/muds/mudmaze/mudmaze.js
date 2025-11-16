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

const Maze = require("./maze.js");
const Room = require("./room.js");
const Player = require("./player.js");

const relay = require("./relay.js");
const getHelp = require("./gethelp.js");
const getLongDirection = require("./getlongdir.js");

const getUser = require("../../helpers/getuser.js");
const print = require("../../helpers/print.js");
const getHumanReadableTimeString = (
  require("../../helpers/humanreadabletimestring.js")
);

const admins = global.admins;

const {
  RegExpMatcher,
  TextCensor,
  englishDataset,
  englishRecommendedTransformers,
  randomCharFromSetCensorStrategy,
} = require('obscenity');

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const censor = new TextCensor().setStrategy(
  randomCharFromSetCensorStrategy("!$%&")
);

function filterDiscordTextFormatting(str) {
  return str.replace(/([-~#`*()_[\]|>])/g, "\\$1");
}

function filter(input) {
  return censor.applyTo(input, matcher.getAllMatches(input));
}

class Entities {
  toArray() {
    return Object.keys(this).map((key) => this[key]);
  }
}

class Players extends Entities {
  getPlayersByUsername(username) {
    username = username.toLowerCase();
    
    const matches = this.toArray().filter((player) => {
      return player.userObj.username.toLowerCase().includes(username);
    });
    
    return matches;
  }
}

class MUDMaze {
  constructor(mazePath) {
    const { readFileSync } = require("fs");
    const baseDir = global.baseDir;
    
    this.strings = JSON.parse(
      readFileSync(`${baseDir}/assets/mudmaze/json/strings/main.json`)
    );
    
    this.name = this.strings.name;
    this.desc = this.strings.desc;
    
    this.players = new Players();
    this.mobs = new Entities();
    this.escapes = 0;
    this.escapeData = [];
    this.playersOnline = 0;
    this.playersHigh = 0;
    this.totalPlayers = 0;
    this.startTime = Date.now();
    
    this.averages = {
      escape: {
        time: undefined,
        moves: undefined,
      },
    };
    
    this.indexes = {
      records: {
        time: undefined,
        moves: undefined,
      },
    };
    
    if (!mazePath) mazePath = `${baseDir}/assets/mudmaze/json/mazes/test.json`;
    
    const jsonMaze = readFileSync(mazePath);
    const mazeData = JSON.parse(jsonMaze);
    
    this.maze = new Maze(mazeData, this);
  }
  
  setAway(msg, awayMessage) {
    const user = getUser(msg);
    const playerData = this.players[user.id];
    
    playerData.flags.isAway = true;
    playerData.timeouts.away = null;  // if invoked via timeout
    
    if (awayMessage) {
      awayMessage = filter(awayMessage);
      playerData.awayMessage = awayMessage;
    }
    
    print(
      msg.channel,
      "You are now away" + (awayMessage ? `: ${awayMessage}` : ".")
    );
    
    const { level, room } = playerData.position;
    const roomObj = this.maze.getRoom({ level, room });
    const mobs = roomObj.mobs.toArray();
    
    if (mobs.length > 0) {
      for (let mob of mobs) {
        if (mob.onPlayerAway) {
          setTimeout(
            (playerData) => mob.onPlayerAway(playerData),
            0,
            playerData,
          );
        }
      }
    }
  }
  
  clearAway(msg) {
    const user = getUser(msg);
    const player = this.players[user.id];
    
    player.flags.isAway = false;
    player.awayMessage = null;
    
    print(msg.channel, "You are no longer away.");
  }
  
  setAwayTimeout(msg) {
    const user = getUser(msg);
    
    this.players[user.id].timeouts.away = setTimeout(() => {
      this.setAway(msg, "Idle");
    }, 300000);
  }
  
  clearAwayTimeout(msg) {
    const user = getUser(msg);
    const player = this.players[user.id]
    const awayTimeout = player.timeouts.away;
    
    if (awayTimeout) {
      clearTimeout(awayTimeout);
      player.timeouts.away = null;
    }
  }
  
  setDebug(msg) {
    const user = getUser(msg);
    
    this.players[user.id].flags.debug = true;
    print(
      msg.channel,
      "*Debug mode enabled until logout or escape. Stats will be discarded.*"
    );
  }
  
  reinsertPlayer(msg) {
    const user = getUser(msg);
    const player = this.players[user.id];
    const level = this.maze.details.spawn.level;
    const room = this.maze.details.spawn.room;
    
    player.time = 0;
    player.moves = 0;
    player.automap = this.initAutomap();
    player.flags.hasEscaped = false;
    player.flags.debug = false;
    player.flags.isCaptive = true;
    player.position = { level, room };
  }
  
  logoutPlayer(msg) {
    const user = getUser(msg);
    const player = this.players[user.id];
    const { level, room } = player.position;
    const hasEscaped = player.flags.hasEscaped;
    const debug = player.flags.debug;
    
    player.lastQuit = Date.now();
    player.flags.isOnline = false;
    player.time += Date.now() - player.lastJoin;
    
    this.playersOnline--;
    
    this.clearAwayTimeout(msg);
    
    delete this.maze.getRoom({ level, room }).players[user.id];
    delete global.states.muds[Symbol.for("mudders")][user.id];
    
    if (debug && !hasEscaped) this.reinsertPlayer(msg);
  }
  
  removePlayer(msg) {
    const user = getUser(msg);
    
    this.logoutPlayer(msg);
    delete this.players[user.id];
  }
  
  getPlayersInGame() {
    return this.players.toArray().filter((player) => player.flags.isOnline);
  }
  
  initAutomap() {
    const depth = this.maze.details.depth;
    const width = this.maze.details.width;
    const height = this.maze.details.height;
    
    const grid = new Array(depth).fill(false);
    
    for (let i = 0; i < depth; i++) {
      grid[i] = new Array(width * height).fill(false);
    }
    
    return grid;
  }
  
  join(msg) {
    const user = getUser(msg);
    
    if (!this.players[user.id]) {
      const level = this.maze.details.spawn.level;
      const room = this.maze.details.spawn.room;
      //const players = this.maze.getRoom({ level, room }).players.toArray();
      const players = this.getPlayersInGame().map((player) => player.userObj);
      
      if (players.length > 0) {
        relay(players, `${user.username} has entered the maze!`);
      }
      
      this.players[user.id] = new Player(
        {
          position: { level, room },
          flags: {
            isOnline: undefined,
            isAway: undefined,
            isJoin: undefined,
            isCaptive: true,
            hasEscaped: false,
            isDisoriented: false,
            debug: false,
          },
          awayMessage: null,
          firstJoin: Date.now(),
          lastQuit: undefined,
          moves: 0,
          time: 0,
          automap: this.initAutomap(),
          stepSound: "footsteps",
          averages: {
            escape: {
              time: undefined,
              moves: undefined,
            },
          },
          indexes: {
            records: {
              time: undefined,
              moves: undefined,
            },
          },
          timeouts: {
            away: null,
            disoriented: null,
          },
          history: {
            command: [],
            move: [],
            room: [],
          },
        },
      );
      
      this.totalPlayers++;
    } else {
      const { level, room } = this.players[user.id].position;
      const players = this.maze.getRoom({ level, room }).players.toArray();
      
      if (players.length > 0) {
        relay(players, `${user.username} joins`);
      }
    }
    
    const player = this.players[user.id];
    
    player.userObj = user;
    player.lastJoin = Date.now();
    player.flags.isOnline = true;
    player.flags.isAway = false;
    player.flags.isJoin = true;
    
    /* moved to Room#enter
    const players = roomObj.players.toArray();
    
    print(
      msg.channel,
      `Welcome to ${this.name}! `
      + this.desc
      + " Type \`help\` for help!\n"
      + roomObj.toString()
      + (
        players.length > 0
        ? ` ${players.toString()}`
        : ""
      )
    );
    
    roomObj.players[user.id] = user;
    this.players[user.id].automap[level][room] = true;
    */
    
    this.playersOnline++;
    
    if (this.playersOnline > this.playersHigh) {
      this.playersHigh = this.playersOnline;
    }
    
    const { level, room } = this.players[user.id].position;
    const roomObj = this.maze.getRoom({ level, room });
    
    roomObj.enter(
      msg,
      (player.flags.isCaptive ? { stepSound: "a loud thud" } : undefined)
    );
    player.flags.isJoin = false;
    this.setAwayTimeout(msg);
    
    console.log(`${user.username} (${user.id}) joins @ (${level},${room})`);
  }
  
  getUpdatedPlayerStats(msg, username) {
    const user = getUser(msg);
    let userID;
    
    if (username) {
      const matches = this.players.getPlayersByUsername(username);
      
      if (matches.length === 1) {
        userID = matches[0].userObj.id;
      } else if (matches.length === 0) {
        return print(
          msg.channel,
          "User not found"
        );
      } else {
        return print(
          msg.channel,
          `${username} matches multiple players, be more specific.`
        );
      }
    } else {
      userID = user.id;
    }
    
    const playerData = this.players[userID];
    let time = playerData.time;
    
    if (playerData.flags.isOnline) time += (Date.now() - playerData.lastJoin);
    
    return {
      time: time,
      moves: playerData.moves,
    };
  }
  
  updateStats(msg) {
    const user = getUser(msg);
    const escapeTime = Date.now();
    const playerStats = this.getUpdatedPlayerStats(msg);
    
    const currentIndex = this.escapeData.push({
      userID: user.id,
      username: user.username,
      escapeTime: escapeTime,
      time: playerStats.time,
      moves: playerStats.moves,
    }) - 1;
    
    function totalEscapeTimesCallback(total, obj) {
      return total += obj.time;
    }
    
    function totalMovesCallback(total, obj) {
      return total += obj.moves;
    }
    
    //global stats
    let totalEscapeTimes = this.escapeData.reduce(totalEscapeTimesCallback, 0);
    let totalMoves = this.escapeData.reduce(totalMovesCallback, 0);
    
    this.averages.escape.time = totalEscapeTimes / this.escapeData.length;
    this.averages.escape.moves = Math.trunc(
      totalMoves / this.escapeData.length
    );
    
    /* best index via Array.prototype.reduce
    function fastestTimeIndexCallback(index, obj, idx, arr) {
      if (obj.time < arr[index].time) {
        return idx;
      } else {
        return index;
      }
    }
    
    function leastMovesIndexCallback(index, obj, idx, arr) {
      if (obj.moves < arr[index].moves) {
        return idx;
      } else {
        return index;
      }
    }
    
    let fastestTimeIndex = this.escapeData.reduce(fastestTimeIndexCallback, 0);
    let leastMovesIndex = this.escapeData.reduce(leastMovesIndexCallback, 0);
    */
    
    /* best index via arrow IIFE (for lexical this)
    let fastestTimeIndex = (() => {
      if (this.indexes.records.time !== undefined) {
        const recordIndex = this.indexes.records.time;
        const recordTime = this.escapeData[recordIndex].time;
        const currentTime = this.escapeData[currentIndex].time;
        
        return currentTime < recordTime ? currentIndex : recordIndex;
      } else {
        return currentIndex;
      }
    })();
    
    let leastMovesIndex = (() => {
      if (this.indexes.records.moves !== undefined) {
        const recordIndex = this.indexes.records.moves;
        const recordMoves = this.escapeData[recordIndex].moves;
        const currentMoves = this.escapeData[currentIndex].moves;
        
        return currentMoves < recordMoves ? currentIndex : recordIndex;
      } else {
        return currentIndex;
      }
    })();
    */
    
    // best index via further abstracted function
    function getBestIndex(records, data, key) {
      if (records[key] !== undefined) {
        const recordIndex = records[key];
        const recordValue = data[recordIndex][key];
        const currentValue = data[currentIndex][key];
        
        return currentValue < recordValue ? currentIndex : recordIndex;
      } else {
        return currentIndex;
      }
    };
    
    let fastestTimeIndex = getBestIndex(
      this.indexes.records,
      this.escapeData,
      "time"
    );
    
    let leastMovesIndex = getBestIndex(
      this.indexes.records,
      this.escapeData,
      "moves"
    );
    
    this.indexes.records.time = fastestTimeIndex;
    this.indexes.records.moves = leastMovesIndex;
    
    //user stats
    const userEscapeData = this.escapeData.filter((x) => x.userID === user.id);
    const player = this.players[user.id];
    
    totalEscapeTimes = userEscapeData.reduce(totalEscapeTimesCallback, 0);
    totalMoves = userEscapeData.reduce(totalMovesCallback, 0);
    
    player.averages.escape.time = (
      totalEscapeTimes / userEscapeData.length
    );
    
    player.averages.escape.moves = Math.trunc(
      totalMoves / userEscapeData.length
    );
    
    /* best index via Array.prototype.reduce
    fastestTimeIndex = this.escapeData.reduce(
      (index, obj, idx, arr) => {
        if (obj.userID === user.id && obj.time < arr[index].time) {
          return idx;
        } else {
          return index;
        }
      },
      this.escapeData.findIndex((data) => data.userID === user.id)
    );
    
    leastMovesIndex = this.escapeData.reduce(
      (index, obj, idx, arr) => {
        if (obj.userID === user.id && obj.moves < arr[index].moves) {
          return idx;
        } else {
          return index;
        }
      },
      this.escapeData.findIndex((data) => data.userID === user.id)
    );
    */
    
    fastestTimeIndex = getBestIndex(
      player.indexes.records,
      this.escapeData,
      "time"
    );
    
    leastMovesIndex = getBestIndex(
      player.indexes.records,
      this.escapeData,
      "moves"
    );
    
    player.indexes.records.time = fastestTimeIndex;
    player.indexes.records.moves = leastMovesIndex;
  }
  
  escapePlayerFromMaze(msg) {
    const user = getUser(msg);
    const playerData = this.players[user.id]
    const fastestTimeIndex = this.indexes.records.time;
    const leastMovesIndex = this.indexes.records.moves;
    const debug = playerData.flags.debug;
    let newRecord = false;
    
    playerData.flags.hasEscaped = true;
    
    this.logoutPlayer(msg);
    
    if (playerData.flags.isDisoriented) {
      clearTimeout(playerData.timeouts.disoriented);
      
      playerData.flags.isDisoriented = false;
      playerData.timeouts.disoriented = null;
    }
    
    if (!debug) this.updateStats(msg);
    
    if (
      fastestTimeIndex !== this.indexes.records.time
      || leastMovesIndex !== this.indexes.records.moves
    ) {
      newRecord = true;
    }
    
    if (!debug) {
      this.escapes++;
      
      const players = this.getPlayersInGame()
        .map((player) => player.userObj)
        .filter((player) => player.id !== user.id)
      ;
      
      relay(players, `${user.username} has escaped the maze!`);
    }
    
    const playerStats = this.getUpdatedPlayerStats(msg);
    
    print(
      msg.channel,
      "Congratulations! You have escaped the maze!"
      + (newRecord
        ? " New record!"
        : ""
      )
      + "\n"
      + "```"
      + `Time  : ${getHumanReadableTimeString(playerStats.time / 1000)}\n`
      + `Moves : ${playerStats.moves}`
      + "```"
    );
    
    const { level, room } = playerData.position;
    const roomObj = this.maze.getRoom({ level, room });
    const mobs = roomObj.mobs.toArray();
    
    if (mobs.length > 0) {
      for (let mob of mobs) {
        if (mob.onPlayerEscape) {
          setTimeout(
            () => mob.onPlayerEscape(),
            0,
          );
        }
      }
    }
    
    this.reinsertPlayer(msg);
  }
  
  go(msg, dir) {
    const user = getUser(msg);
    const width = this.maze.details.width;
    const playerData = this.players[user.id];
    let { level, room } = playerData.position;
    let roomObj = this.maze.getRoom({ level, room });
    let toDir, fromDir, invalidDir;
    
    if (playerData.flags.isDisoriented) {
      if (dir in roomObj.exits) {
        const exits = Object.keys(roomObj.exits);
        const index = Math.floor(Math.random() * exits.length);
        dir = exits[index];
      }
    }
    
    /* moved to getlongdir.js module
    switch (dir) {
      case "n":
        toDir = "north";
        break;
      
      case "ne":
        toDir = "northeast";
        break;
      
      case "e":
        toDir = "east";
        break;
      
      case "se":
        toDir = "southeast";
        break;
      
      case "s":
        toDir = "south";
        break;
      
      case "sw":
        toDir = "southwest";
        break;
      
      case "w":
        toDir = "west";
        break;
      
      case "nw":
        toDir = "northwest";
        break;
      
      case "u":
        toDir = "level above";
        break;
      
      case "d":
        toDir = "level below";
        break;
      
      default:
        throw new Error("Invalid direction");
      //end cases
    }
    */
    
    toDir = getLongDirection(dir);
    
    switch (dir) {
      case "u":
        invalidDir = "up";
        break;
      
      case "d":
        invalidDir = "down";
        break;
      
      default:
        invalidDir = toDir;
      //end cases
    }
    
    if (Object.prototype.hasOwnProperty.call(roomObj.exits, dir)) {
      roomObj.exit(msg, { toDir });
      
      if (roomObj.exits[dir].isEscape) {
        playerData.history.move.push(dir);
        playerData.moves++;
        
        return this.escapePlayerFromMaze(msg);
      } else if (roomObj.exits[dir].dest) {
        const dest = roomObj.exits[dir].dest;
        
        if (this.maze.isValidDestination(dest)) {
          ({ level, room } = dest.position);
          fromDir = dest.fromDir;
        } else {
          throw new Error("Invalid destination");
        }
      } else {
        /* moved to Room#getAdjacentRoomDestinationData
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
        */
        
        ({ position: { level, room }, fromDir } = (
          roomObj.getAdjacentRoomDestinationData(dir)
        ));
      }
      
      roomObj = this.maze.getRoom({ level, room });
      
      if (!Room.isRoom(roomObj)) {
        playerData.history.move.push(dir);
        playerData.moves++;
        
        return this.escapePlayerFromMaze(msg);
      }
      
      playerData.history.move.push(dir);
      playerData.moves++;
      
      roomObj.enter(msg, { fromDir });
    } else {
      print(msg.channel, `You can't go ${invalidDir}.`);
    }
  }
  
  printGlobalStats(msg) {
    const avgEscapeTime = this.averages.escape.time;
    const avgMoves = this.averages.escape.moves;
    const fastestTimeIndex = this.indexes.records.time;
    const leastMovesIndex = this.indexes.records.moves;
    const fastestTimeEscapeData = this.escapeData[fastestTimeIndex];
    const leastMovesEscapeData = this.escapeData[leastMovesIndex];
    
    print(
      msg.channel,
      "**Global Stats**"
      + "```"
      + `Players online : ${this.playersOnline}`
      + ` (apex: ${this.playersHigh})\n`
      + `Total players  : ${this.totalPlayers}\n`
      + "Uptime         : "
      + getHumanReadableTimeString((Date.now() - this.startTime) / 1000)
      + `\nSince          : ${new Date(this.startTime).toUTCString()}`
      + "```"
      + (this.escapeData.length > 0
        ? "\n**Escapes**"
          + "```"
          + `Escapes        : ${this.escapes}\n`
          + "Average time   : "
          + `${getHumanReadableTimeString(avgEscapeTime / 1000)}\n`
          + `Average moves  : ${avgMoves}\n`
          + "Last escape    : "
          + (
            new Date(this.escapeData[this.escapeData.length - 1].escapeTime)
            .toUTCString()
          )
          + "\n\n"
          + "```"
          + "\n**Records**"
          + "```"
          + "Fastest time   : "
          + getHumanReadableTimeString(
            fastestTimeEscapeData.time / 1000
          )
          + ` (${fastestTimeEscapeData.username})`
          + "\n"
          + `Least moves    : ${leastMovesEscapeData.moves}`
          + ` (${leastMovesEscapeData.username})`
          + "```"
        : ""
      )
    );
  }
  
  printUserStats(msg, username) {
    const user = getUser(msg);
    let userID;
    
    if (username) {
      const matches = this.players.getPlayersByUsername(username);
      
      if (matches.length === 1) {
        userID = matches[0].userObj.id;
      } else if (matches.length === 0) {
        return print(
          msg.channel,
          "User not found"
        );
      } else {
        return print(
          msg.channel,
          `${username} matches multiple players, be more specific.`
        );
      }
    } else {
      userID = user.id;
    }
    
    const playerData = this.players[userID];
    const playerStats = this.getUpdatedPlayerStats(msg, username);
    
    const avgEscapeTime = playerData.averages.escape.time;
    const avgMoves = playerData.averages.escape.moves;
    const fastestTimeIndex = playerData.indexes.records.time;
    const leastMovesIndex = playerData.indexes.records.moves;
    
    const fastestTimeEscapeData = this.escapeData[fastestTimeIndex];
    const leastMovesEscapeData = this.escapeData[leastMovesIndex];
    
    const userEscapeData = (
      this.escapeData.filter((data) => data.userID === userID)
    );
    
    print(
      msg.channel,
      "\n**"
      + (
        username
        ? `${playerData.userObj.username}'s`
        : "Your"
      )
      + " Stats**"
      + "```"
      + "Time           : "
      + getHumanReadableTimeString(playerStats.time / 1000)
      + "\n"
      + `Moves          : ${playerStats.moves}\n`
      + "Status         : "
      + (
        playerData.flags.isOnline
        ? (
          playerData.flags.isAway
          ? "Away"
          : "Online"
        )
        : "Offline"
      )
      + "\n"
      + (
        (
          playerData.flags.isOnline
          && playerData.flags.isAway
          && playerData.awayMessage
        )
        ? (
          `Away message   : ${playerData.awayMessage}\n`
        )
        : ""
      )
      + (
        playerData.flags.isOnline
        ? ""
        : `Last seen      : ${new Date(playerData.lastQuit).toUTCString()}\n`
      )
      + `Last join      : ${new Date(playerData.lastJoin).toUTCString()}\n`
      + "First "
      + (
        playerData.flags.isOnline
        ? "join"
        : "seen"
      )
      + `     : ${new Date(playerData.firstJoin).toUTCString()}`
      + "```"
      + (userEscapeData.length > 0
        ? "\n**Escapes**"
          + "```"
          + `Escapes        : ${userEscapeData.length}\n`
          + "Average time   : "
          + `${getHumanReadableTimeString(avgEscapeTime / 1000)}\n`
          + `Average moves  : ${avgMoves}\n`
          + "Last escape    : "
          + (
            new Date(userEscapeData[userEscapeData.length - 1].escapeTime)
            .toUTCString()
          )
          + "\n\n"
          + "```"
          + "\n**Bests**"
          + "```"
          + "Fastest time   : "
          + getHumanReadableTimeString(
            fastestTimeEscapeData.time / 1000
          )
          + "\n"
          + `Least moves    : ${leastMovesEscapeData.moves}`
          + "```"
        : ""
      )
    );
  }
  
  getAdjacentRooms(level, room) {
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
  
  getAdjacentOccupiedRooms(level, room) {
    return this.getAdjacentRooms(level, room).filter(({ level, room }) => {
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
  
  parse(msg, content) {
    const user = getUser(msg);
    const args = content.split(" ");
    const command = args.shift();
    
    function printCommandNotFound() {
      print(msg.channel, `I don't know the word \`${command}\`.`);
    }
    
    this.players[user.id].history.command.push(content);
    this.clearAwayTimeout(msg);
    
    if (
      command !== "away"
      && this.players[user.id].flags.isAway
    ) this.clearAway(msg);
    
    switch (command) {
      case "n":
      case "north":
        this.go(msg, "n");
        break;
      
      case "ne":
      case "northeast":
        this.go(msg, "ne");
        break;
      
      case "e":
      case "east":
        this.go(msg, "e");
        break;
      
      case "se":
      case "southeast":
        this.go(msg, "se");
        break;
      
      case "s":
      case "south":
        this.go(msg, "s");
        break;
      
      case "sw":
      case "southwest":
        this.go(msg, "sw");
        break;
      
      case "w":
      case "west":
        this.go(msg, "w");
        break;
      
      case "nw":
      case "northwest":
        this.go(msg, "nw");
        break;
      
      case "u":
      case "up":
        this.go(msg, "u");
        break;
      
      case "d":
      case "down":
        this.go(msg, "d");
        break;
      
      case "l":
      case "look":
        (() => {
          const { level, room } = this.players[user.id].position;
          const roomObj = this.maze.getRoom({ level, room });
          const players = roomObj.players.toArray().filter(
            (userInRoom) => user.id !== userInRoom.id
          );
          const mobs = roomObj.mobs.toArray();
          
          const desc = (
            roomObj.toString()
            + (
              players.length > 0
              ? ` ${players.toString()}`
              : ""
            )
            + (
              mobs.length > 0
              ? ` ${mobs.toString()}`
              : ""
            )
          );
          
          print(msg.channel, desc);
          //this.players[user.id].moves++;
        })();
        break;
      
      case "h":
      case "help":
        if (args.length === 0) {
          print(
            msg.channel,
            "I understand the following commands (shortcuts in parentheses):\n"
            + "```"
            + "north     (n)  : Go north\n"
            + "northeast (ne) : Go northeast\n"
            + "east      (e)  : Go east\n"
            + "southeast (se) : Go southeast\n"
            + "south     (s)  : Go south\n"
            + "southwest (sw) : Go southwest\n"
            + "west      (w)  : Go west\n"
            + "northwest (nw) : Go northwest\n"
            + "up        (u)  : Go up\n"
            + "down      (d)  : Go down\n"
            + "look      (l)  : Describe room\n"
            + `quit      (q)  : Quit ${this.name}\n`
            + "help      (h)  : Show commands\n"
            + "map       (m)  : Show automap\n"
            + "say            : Speak to a room\n"
            + "tell           : Speak to a player\n"
            + "yell           : Speak to adjacent rooms\n"
            + "away           : Toggle away status\n"
            + "stats          : Game statistics\n"
            + "listen         : Listen to surroundings\n"
            + (
              admins.includes(user.id)
              ? (
                "teleport       : Teleport to a room\n"
                + "query          : Query various game details"
              )
              : ""
            )
            + "```"
            + "Type \`help <command>\` to query usage statements.",
          );
        } else {
          const str = getHelp(msg, args[0], ...args.slice(1));
          
          print(msg.channel, str);
        }
        break;
      
      case "q":
      case "quit":
        (() => {
          const { level, room } = this.players[user.id].position;
          const roomObj = this.maze.getRoom({ level, room });
          
          print(msg.channel, `Thank you for playing ${this.name}!`);
          this.logoutPlayer(msg);
          
          const players = roomObj.players.toArray();
          
          if (players.length > 0) {
            relay(players, `${user.username} quits`);
          }
          
          const mobs = roomObj.mobs.toArray();
          
          if (mobs.length > 0) {
            for (let mob of mobs) {
              if (mob.onPlayerQuit) {
                setTimeout(
                  () => mob.onPlayerQuit(),
                  0,
                );
              }
            }
          }
        })();
        
        console.log(`${user.username} (${user.id}) quits`);
        
        return;
      
      case "say":
        (() => {
          if (args.length === 0) {
            return print(msg.channel, getHelp(msg, command));
          }
          
          const { level, room } = this.players[user.id].position;
          const dialogue = filter(args.join(" "));
          const players = this.maze.getRoom({ level, room }).players.toArray()
            .filter((userInRoom) => user.id !== userInRoom.id)
          ;
          
          if (players.length > 0) {
            relay(players, `${user.username} says "${dialogue}"`);
          }
          print(msg.channel, `You say "${dialogue}"`);
        })();
        
        console.log(`${user.username} @ (${level},${room}) says "${dialogue}"`);
        
        break;
      
      case "tell":
        (() => {
          if (args.length < 2) {
            return print(msg.channel, getHelp(msg, command));
          }
          
          const { level, room } = this.players[user.id].position;
          const username = args[0].toLowerCase();
          const dialogue = filter(args.slice(1).join(" "));
          const roomObj = this.maze.getRoom({ level, room });
          const presentPlayers = roomObj.players.toArray();
          const matches = presentPlayers.getPlayersByUsername(username);
          
          /*
          const presentPlayers = (
            this.maze.getRoom({ level, room }).players.toArray()
          );
          const matches = presentPlayers
            .map((userInRoom) => userInRoom.username.toLowerCase())
            .filter((usernameInRoom) => usernameInRoom.includes(username))
          ;
          
          let player;
          
          if (matches.length === 1) {
            player = presentPlayers.find((userInRoom) =>
                userInRoom.username.toLowerCase().includes(username)
            );
          }
          */
          
          if (matches.length === 1) {
            const player = matches[0];
            
            relay([ player ], `${user.username} tells you "${dialogue}"`);
            print(
              msg.channel,
              `You tell ${player.username} "${dialogue}"`
              + (
                this.players[player.id].flags.isAway
                ? `\n${player.username} is away`
                : ""
              )
              + (
                this.players[player.id].flags.isAway
                && this.players[player.id].awayMessage
                ? `: ${this.players[player.id].awayMessage}`
                : "."
              )
            );
            
            console.log(
              `${user.username} tells ${player.username} "${dialogue}"`
            );
          } else if (matches.length === 0) {
              print(msg.channel, `${args[0]} is not present.`);
          } else {
            print(
              msg.channel,
              `${args[0]} matches multiple players, be more specific.`
            );
          }
        })();
        break;
      
      case "yell":
        (() => {
          const width = this.maze.details.width;
          
          if (args.length === 0) {
            return print(msg.channel, getHelp(msg, command));
          }
          
          const { level, room } = this.players[user.id].position;
          const dialogue = filter(args.join(" ").toUpperCase());
          
          const yell = (level, room, fromDir) => {
            if (
              level < 0
              || level >= this.maze.grid.length
              || room < 0
              || room >= this.maze.grid[level].length
            ) return;
            
            const roomObj = this.maze.getRoom({ level, room });
            
            if (Room.isRoom(roomObj)){
              let players = roomObj.players.toArray();
              
              if (
                level === this.players[user.id].position.level
                && room === this.players[user.id].position.room
              ) {
                players = players.filter(
                  (userInRoom) => user.id !== userInRoom.id
                );
              }
              
              if (players.length > 0) {
                relay(
                  players,
                  (
                    level === this.players[user.id].position.level
                    && room === this.players[user.id].position.room
                  )
                  ? `${user.username} yells "${dialogue}"`
                  : `Someone yells "${dialogue}" from the ${fromDir}.`
                );
              }
            }
          };
          
          if (room % width !== 0) {
            if (room - (width + 1) >= 0) {
              yell(level, room - (width + 1), "southeast");
            }
            
            yell(level, room - 1, "east");
            
            if (room + (width - 1) < this.maze.grid[level].length) {
              yell(level, room + (width - 1), "northeast");
            }
          }
          
          if (room - width >= 0) {
            yell(level, room - width, "south");
          }
          
          if (room % width !== width - 1) {
            if (room - (width - 1) >= 0) {
              yell(level, room - (width - 1), "southwest");
            }
            
            yell(level, room + 1, "west");
            
            if (room + (width + 1) < this.maze.grid[level].length) {
              yell(level, room + (width + 1), "northwest");
            }
          }
          
          if (room + width < this.maze.grid[level].length) {
            yell(level, room + width, "north");
          }
          
          if (level - 1 >= 0) {
            yell(level - 1, room, "level above");
          }
          
          if (level + 1 < this.maze.grid.length) {
            yell(level + 1, room, "level below");
          }
          
          yell(level, room);
          
          print(msg.channel, `You yell "${dialogue}"`);
        })();
        
        console.log(
          `${user.username} @ (${level},${room}) yells "${dialogue}"`
        );
        
        break;
      
      case "teleport":
        (() => {
          if (!admins.includes(user.id)) return printCommandNotFound();
          
          if (
            !admins.includes(user.id) && (args.length < 1 || args.length > 1)
            || admins.includes(user.id) && (args.length < 1 || args.length > 3)
          ) {
            return print(msg.channel, getHelp(msg, command));
          }
          
          let { level, room } = this.players[user.id].position;
          let destLevel, destRoom;
          
          if (args.length === 1) {
            if (args[0] === "spawn") {
              destLevel = this.maze.details.spawn.level;
              destRoom = this.maze.details.spawn.room;
            }
          }
          
          if (admins.includes(user.id)) {
            if (args.length === 2) {
              [ destLevel, destRoom ] = args.map((index) => Number(index));
            }
            
            if (args.length === 3) {
              destLevel = Number(args[2]);
              destRoom = +args[0] + this.maze.details.width * +args[1];
            }
          }
          
          if (
            this.maze.grid[destLevel]
            && this.maze.grid[destLevel][destRoom]
          ) {
            /*
            if (
              destLevel !== this.maze.details.spawn.level
              || destRoom !== this.maze.details.spawn.room
            ) this.setDebug(msg);
            */
            
            this.setDebug(msg);
            
            let roomObj = this.maze.getRoom({ level, room });
            
            //delete this.maze.getRoom({ level, room }).players[user.id];
            roomObj.exit(msg, { isTeleport: true });
            
            [ level, room ] = [ destLevel, destRoom ];
            
            /* manual insertion
            this.players[user.id].position = { level, room };
            this.maze.getRoom({ level, room }).players[user.id] = user;
            print(msg.channel, "\\*poof\\*");
            */
            roomObj = this.maze.getRoom({ level, room });
            roomObj.enter(msg, { isTeleport: true });
          } else {
            print(msg.channel, "Destination invalid");
          }
        })();
        break;
      
      case "away":
        (() => {
          const awayMessage = msg.content.slice(5);
          
          if (!this.players[user.id].flags.isAway) {
            this.setAway(msg, awayMessage);
          } else {
            this.clearAway(msg);
          }
        })();
        break;
      
      case "stats":
        (() => {
          if (args[0] === "global") {
            return this.printGlobalStats(msg);
          } else if (args[0] === "self") {
            return this.printUserStats(msg);
          } else if (args[0] === "player") {
            return this.printUserStats(msg, args[1]);
          } else {
            print(msg.channel, getHelp(msg, "stats"));
          }
        })();
        break;
      
      case "m":
      case "map":
        ((zIndex, username) => {
          let userID;
          
          if (username && admins.includes(user.id)) {
            username = username.toLowerCase();
            
            const matches = this.players.getPlayersByUsername(username);
            
            /*
            const player = this.players.toArray().find(
              (player) => player.userObj.username.toLowerCase() === username
            );
            
            if (player) {
              userID = player.userObj.id;
            } else {
              return print(msg.channel, "User not found");
            }
            */
            
            if (matches.length === 1) {
              userID = matches[0].userObj.id;
            } else if (matches.length === 0) {
              return print(
                msg.channel,
                "User not found"
              );
            } else {
              return print(
                msg.channel,
                `${args[1]} matches multiple players, be more specific.`
              );
            }
          } else {
            userID = user.id;
          }
          
          const player = this.players[userID];
          let { level, room } = player.position;
          
          zIndex = Number(zIndex);
          
          if (
            zIndex
            && zIndex >= 0
            && zIndex < this.maze.grid.length
          ) level = zIndex;
          
          const width = this.maze.details.width;
          const topLeftBorderChar = "\u250c";
          const topRightBorderChar = "\u2510";
          const bottomLeftBorderChar = "\u2514";
          const bottomRightBorderChar = "\u2518";
          const horizontalBorderChar = "\u2500";
          const verticalBorderChar = "\u2502";
          let mapStr = "```\n";
          
          mapStr += (
            topLeftBorderChar
            + horizontalBorderChar.repeat(width + 2)
            + topRightBorderChar
            + "\n"
          );
          
          this.players[userID].automap[level].forEach((v, i) => {
            if (i > 0 && i % width === 0) mapStr += "\n";
            if (i % width === 0) mapStr += (verticalBorderChar + " ");
            
            mapStr += (
              level === player.position.level && i === room
              ? "@"
              : (
                v
                ? "#"
                : " "
              )
            );
            
            if (i % width === width - 1) mapStr += (" " + verticalBorderChar);
          });
          
          mapStr += (
            "\n"
            + bottomLeftBorderChar
            + horizontalBorderChar.repeat(width + 2)
            + bottomRightBorderChar
          );
          mapStr += "```";
          
          print(msg.channel, mapStr);
        })(args[0], args[1]);
        break;
      
      case "query":
        if (admins.includes(user.id)) {
          (() => {
            switch (args[0]) {
              case "players":
                switch (args[1]) {
                  case "online":
                    (() => {
                      const onlinePlayers = (
                        this.getPlayersInGame()
                        .map((player) => player.userObj.username)
                      );
                      
                      print(
                        msg.channel,
                        `**Players Online (${onlinePlayers.length})**`
                        + "```"
                        + onlinePlayers.join(", ")
                        + "```"
                      );
                    })();
                    break;
                  
                  case "offline":
                    (() => {
                      const offlinePlayers = (
                        this.players.toArray()
                        .filter((player) => !player.flags.isOnline)
                        .map((player) => player.userObj.username)
                      );
                      
                      print(
                        msg.channel,
                        `**Players Offline (${offlinePlayers.length})**`
                        + "```"
                        + (
                          offlinePlayers.length > 0
                          ? offlinePlayers.join(", ")
                          : "No players offline"
                        )
                        + "```"
                      );
                    })();
                    break;
                  
                  case "all":
                    (() => {
                      const allPlayers = (
                        this.players.toArray()
                        .map((player) => player.userObj.username)
                      );
                      
                      print(
                        msg.channel,
                        `**All Players (${allPlayers.length})**`
                        + "```"
                        + allPlayers.join(", ")
                        + "```"
                      );
                    })();
                    break;
                  
                  default:
                    print(
                      msg.channel,
                      getHelp(msg, "query", "players")
                    );
                  //end cases
                }
                break;
              
              case "coords":
                (() => {
                  if (args[1]) {
                    const username = args[1].toLowerCase();
                    const matches = this.players.getPlayersByUsername(username);
                    
                    /*
                    const pos = (
                      this.players.toArray()
                      .find((player) => {
                        return (
                          player.userObj.username.toLowerCase() === username
                        );
                      })
                      ?.position
                    );
                    */
                    
                    if (matches.length === 1) {
                      const pos = matches[0].position;
                      
                      return print(
                        msg.channel,
                        "X: "
                        + pos.room % this.maze.details.width
                        + ", Y: "
                        + Math.floor(pos.room / this.maze.details.width)
                        + ", Z: "
                        + pos.level
                        + ` (${pos.level}, ${pos.room})`
                      );
                    } else if (matches.length === 0) {
                      return print(
                        msg.channel,
                        "User not found"
                      );
                    } else {
                      return print(
                        msg.channel,
                        `${args[1]} matches multiple players, be more specific.`
                      );
                    }
                  } else {
                    return print(
                      msg.channel,
                      getHelp(msg, "query", "coords")
                    );
                  }
                })();
                break;
              
              default:
                print(
                  msg.channel,
                  getHelp(msg, "query")
                );
              //end cases
            }
          })();
        } else {
          printCommandNotFound();
        }
        break;
      
      case "listen":
        (() => {
          const roomObj = this.maze.getRoom({
            level: this.players[user.id].position.level,
            room: this.players[user.id].position.room
          });
          
          const adjacentRooms = roomObj.getAdjacentOccupiedRooms();
          
          if (adjacentRooms.length > 0) {
            /*
            adjacentRooms.forEach(({ level, room, fromDir }) => {
              const roomObj = this.maze.getRoom({ level, room });
              
              if (Room.isRoom(roomObj)) {
                const mobs = roomObj.mobs.toArray();
                const players = roomObj.players.toArray();
                
                if (mobs.length > 0) {
                  mobs.forEach((mob) => {
                    print(
                      msg.channel,
                      `You hear ${mob.stepSound} from the ${fromDir}.`
                    );
                  });
                }
                
                if (players.length > 0) {
                  players.forEach((player) => {
                    print(
                      msg.channel,
                      `You hear ${player.stepSound} from the ${fromDir}.`
                    );
                  });
                }
              }
            });
            */
            
            roomObj.printAdjacentRoomStepSounds(msg);
          } else {
            print(
              msg.channel,
              "You listen to your surroundings but hear nothing of note."
            );
          }
        })();
        break;
      
      case "debug":
        (() => {
          const debug = this.players[user.id].flags.debug;
          
          print(msg.channel, debug);
        })();
        break;
      
      case "xyzzy":
      case "plugh":
        print(msg.channel, "Nothing happens.");
        break;
      
      default:
        printCommandNotFound();
      //end cases
    }
    
    if (
      !this.players[user.id].flags.isAway
      && this.players[user.id].flags.isOnline
    ) this.setAwayTimeout(msg);
  }
}

module.exports = MUDMaze;
