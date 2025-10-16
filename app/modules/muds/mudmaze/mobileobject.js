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

const Room = require("./room.js");

const getLongDirection = require("./getlongdir.js");
const getOppositeDirection = require("./getoppositedir.js");

class MobileObject {
  static nextID = 1;
  
  constructor(maze, levelArg, roomArg) {
    if (
      levelArg !== undefined
      && (
        typeof levelArg !== "number"
        || !Number.isInteger(levelArg)
        || levelArg < 0
        || levelArg >= maze.grid.length
      )
    ) throw new Error("Invalid mobile object level index argument");
    
    if (
      (
        levelArg !== undefined
        && roomArg !== undefined
      )
      && (
        typeof roomArg !== "number"
        || !Number.isInteger(roomArg)
        || roomArg < 0
        || roomArg >= maze.grid[levelArg].length
      )
    ) throw new Error("Invalid mobile object room index argument");
    
    this.id = MobileObject.nextID++;
    this.maze = maze;
    this.timeouts = {
      move: null,
    };
    this.randomMoveDirections = [
      "n", "ne", "e", "se", "s", "sw", "w", "nw", "u", "d"
    ];
    this.randomMoveTimeoutMinimumMilliseconds = 15 * 1000;
    this.randomMoveTimeoutMaxAdditionalSeconds = 45;
    this.lastMove;
    
    let level, room, roomObj;
    
    do {
      level = (
        levelArg === undefined
        ? Math.floor(Math.random() * maze.grid.length)
        : levelArg
      );
      
      room = (
        roomArg === undefined
        ? Math.floor(Math.random() * maze.grid[level].length)
        : roomArg
      );
      
      roomObj = maze.getRoom({ level, room });
    } while (
      !Room.isRoom(roomObj)
      || (
        level === maze.details.spawn.level
        && room === maze.details.spawn.room
      )
      || roomObj.players.toArray().length !== 0
    );
    
    this.position = { level, room };
  }
  
  getCurrentRoom() {
    const { level, room } = this.position;
    
    return this.maze.getRoom({ level, room });
  }
  
  setMoveTimeout(dirs, ms) {
    this.timeouts.move = setTimeout(
      (dirs) => {
        this.moveRandomDirection(dirs);
        //this.setMoveTimeout(dirs, ms);
      },
      ms,
      dirs
    );
  }
  
  clearMoveTimeout() {
    clearTimeout(this.timeouts.move);
    this.timeouts.move = null;
  }
  
  getRandomMoveRandomTimeout() {
    return (
      (
        Math.floor(
          Math.random() * (this.randomMoveTimeoutMaxAdditionalSeconds + 1)
        ) * 1000
      )
      + this.randomMoveTimeoutMinimumMilliseconds
    );
  }
  
  moveRandomDirection(dirs) {
    this.clearMoveTimeout();
    
    let { level, room } = this.position;
    const fromRoom = this.maze.getRoom({ level, room });
    const exitsObj = fromRoom.exits;
    let exitKeys = Object.keys(exitsObj).filter((key) => dirs.includes(key));
    let key, toRoom, fromDir;
    
    exitKeys = exitKeys.filter((key) => !exitsObj[key].isEscape);
    exitKeys = exitKeys.filter((key) => {
      const { position: { level, room } } = (
        exitsObj[key].dest
        ? exitsObj[key].dest
        : fromRoom.getAdjacentRoomDestinationData(key)
      );
      const toRoom = this.maze.getRoom({ level, room });
      return Room.isRoom(toRoom);
    });
    
    if (exitKeys.length > 1 && this.lastMove) {
      exitKeys = exitKeys.filter((key) => {
        return key !== getOppositeDirection(this.lastMove);
      });
    }
    
    do {
      const index = Math.floor(Math.random() * exitKeys.length);
      key = exitKeys[index];
      exitKeys.splice(index, 1);
      
      //if (exitsObj[key].isEscape) continue;
      
      if (exitsObj[key].dest) {
        const dest = exitsObj[key].dest;
        
        if (this.maze.isValidDestination(dest)) {
          ({ level, room } = dest.position);
          fromDir = dest.fromDir;
        } else {
          throw new Error("Invalid destination");
        }
      } else {
        ({ position: { level, room }, fromDir } = (
          fromRoom.getAdjacentRoomDestinationData(key)
        ));
      }
      
      toRoom = this.maze.getRoom({ level, room });
    } while (!Room.isRoom(toRoom) && exitKeys.length > 0);
    
    if (Room.isRoom(toRoom)) {
      const toDir = getLongDirection(key);
      
      fromRoom.exit(null, { entity: this, toDir });
      toRoom.enter(null, { entity: this, fromDir });
      
      this.lastMove = key;
      
      //console.log(`${this.kind} moves to (${level}, ${room})`);
    }
    
    this.setMoveTimeout(
      this.randomMoveDirections,
      this.getRandomMoveRandomTimeout()
    );
    
    switch (this.kind) {
      case "cat":
        (() => {
          const players = toRoom.players.toArray();
          
          if (
            players.length > 0
            && (
              !players.every(
                (player) => this.maze.mud.players[player.id].flags.isAway
              )
            )
          ) {
            this.clearMoveTimeout();
          }
        })();
        break;
      
      case "rat":
        if (toRoom.players.toArray().length > 0) {
          this.moveRandomDirection(dirs);
        }
        break;
      
      case "cultist":
      case "giant spider":
        (() => {
          const players = toRoom.players.toArray();
          
          if (players.length > 0) {
            const player = players[Math.floor(Math.random() * players.length)];
            const playerData = this.maze.mud.players[player.id];
            
            this.performEncounterTasks(playerData);
          }
        })();
        break;
      
      case "banshee":
        (() => {
          const players = toRoom.players.toArray();
          
          if (players.length > 0) {
            this.performEncounterTasks(players);
          }
        })();
      //end cases
    }
    
    /*
    if (this.kind === "rat" && toRoom.players.toArray().length > 0) {
      this.moveRandomDirection(dirs);
    }
    */
  }
}

module.exports = MobileObject;
