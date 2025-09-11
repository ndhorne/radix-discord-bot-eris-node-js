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

const Room = require("../room.js");
const MobileObject = require("../mobileobject.js");

const getLongDirection = require("../getlongdir.js");
const getOppositeDirection = require("../getoppositedir.js");

class Ghost extends MobileObject {
  constructor(maze, level, room) {
    super(maze, level, room);
    this.kind = "ghost";
    this.stepSound = "shackles";
  }
  
  moveRandomDirection(dirs) {
    this.clearMoveTimeout();
    
    let { level, room } = this.position;
    const fromRoom = this.maze.getRoom({ level, room });
    const exitsObj = fromRoom.exits;
    const exitKeys = Object.keys(exitsObj).filter((key) => dirs.includes(key));
    const invalidExits = [];
    let key, toRoom, fromDir;
    
    exitKeys.forEach((key) => {
      if (exitsObj[key].isEscape) invalidExits.push(key);
    });
    
    exitKeys.forEach((key) => {
      const { position: { level, room } } = (
        exitsObj[key].dest
        ? exitsObj[key].dest
        : fromRoom.getAdjacentRoomDestinationData(key)
      );
      const toRoom = this.maze.getRoom({ level, room });
      if (!Room.isRoom(toRoom)) invalidExits.push(key);
    });
    
    dirs = dirs.filter((key) => !invalidExits.includes(key));
    
    if (this.lastMove) {
      dirs = dirs.filter((key) => {
        return key !== getOppositeDirection(this.lastMove);
      });
    }
    
    do {
      const dirsIndex = Math.floor(Math.random() * dirs.length);
      key = dirs[dirsIndex];
      dirs.splice(dirsIndex, 1);
      
      if (exitsObj[key]) {
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
      } else {
        ({ level, room } = this.position);
        
        const row = Math.floor(room / this.maze.details.width);
        
        switch (key) {
          case "n":
            do {
              room -= this.maze.details.width;
            } while (
              !Room.isRoom(this.maze.getRoom({ level, room }))
              && room >= 0
            );
            if (room < 0) continue; 
            break;
          
          case "ne":
            do {
              room -= (this.maze.details.width - 1);
            } while (
              !Room.isRoom(this.maze.getRoom({ level, room }))
              && room >= 0
            );
            if (room < 0) continue;
            break;
          
          case "e":
            do {
              room += 1;
            } while (
              !Room.isRoom(this.maze.getRoom({ level, room }))
              && Math.floor(room / this.maze.details.width) === row
            );
            if (Math.floor(room / this.maze.details.width) > row) continue;
            break;
          
          case "se":
            do {
              room += (this.maze.details.width + 1);
            } while (
              !Room.isRoom(this.maze.getRoom({ level, room }))
              && room < this.maze.grid[level].length
            );
            if (room >= this.maze.grid[level].length) continue;
            break;
          
          case "s":
            do {
              room += this.maze.details.width;
            } while (
              !Room.isRoom(this.maze.getRoom({ level, room }))
              && room < this.maze.grid[level].length
            );
            if (room >= this.maze.grid[level].length) continue; 
            break;
          
          case "sw":
            do {
              room += (this.maze.details.width - 1);
            } while (
              !Room.isRoom(this.maze.getRoom({ level, room }))
              && room < this.maze.grid[level].length
            );
            if (room >= this.maze.grid[level].length) continue;
            break;
          
          case "w":
            do {
              room -= 1;
            } while (
              !Room.isRoom(this.maze.getRoom({ level, room }))
              && Math.floor(room / this.maze.details.width) === row
            );
            if (Math.floor(room / this.maze.details.width) < row) continue;
            break;
          
          case "nw":
            do {
              room -= (this.maze.details.width + 1);
            } while (
              !Room.isRoom(this.maze.getRoom({ level, room }))
              && room >= 0
            );
            if (room < 0) continue;
            break;
          
          case "u":
            do {
              level += 1;
            } while (
              !Room.isRoom(this.maze.getRoom({ level, room }))
              && level < this.maze.grid.length
            )
            if (level >= this.maze.grid.length) continue;
            break;
          
          case "d":
            do {
              level -= 1;
            } while (
              !Room.isRoom(this.maze.getRoom({ level, room }))
              && level >= 0
            )
            if (level < 0) continue;
            break;
          //end cases
        }
      }
      
      fromDir = getLongDirection(getOppositeDirection(key));
      toRoom = this.maze.getRoom({ level, room });
    } while (!Room.isRoom(toRoom) && dirs.length > 0);
    
    if (Room.isRoom(toRoom)) {
      const toDir = getLongDirection(key);
      
      fromRoom.exit(null, { entity: this, toDir });
      toRoom.enter(null, { entity: this, fromDir });
      
      this.lastMove = key;
      
      //console.log(`${this.kind} moves to (${level}, ${room})`);
    } else {
      console.error(`${this.kind} attempts to enter invalid room`);
    }
    
    this.setMoveTimeout(
      this.randomMoveDirections,
      this.getRandomMoveRandomTimeout()
    );
  }
  
}

module.exports = Ghost;
