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
const Cat = require("./mobs/cat.js");
const Rat = require("./mobs/rat.js");
const Cultist = require("./mobs/cultist.js");
const GiantSpider = require("./mobs/giantspider.js");
const Ghost = require("./mobs/ghost.js");
const Banshee = require("./mobs/banshee.js");

class Maze {
  constructor(mazeData, mud) {
    this.details = mazeData.details;
    this.mud = mud;
    
    const depth = this.details.depth;
    const width = this.details.width;
    const height = this.details.height;
    
    this.grid = new Array(depth).fill(null);
    
    for (let i = 0; i < depth; i++) {
      this.grid[i] = new Array(width * height).fill(null);
    }
    
    mazeData.rooms.forEach((room) => {
      const z = room.z;
      const x = room.x;
      const y = room.y;
      
      const name = room.name;
      const desc = room.desc;
      const exits = room.exits;
      
      this.grid[z][x + width * y] = new Room(
        { x, y, z }, name, desc, exits, this
      );
    });
    
    if (this.details.mobs.cat) {
      const cat = new Cat(this);
      this.insertMobileObject(cat);
      cat.setMoveTimeout(
        cat.randomMoveDirections,
        cat.getRandomMoveRandomTimeout()
      );
    }
    
    if (this.details.mobs.rat) {
      for (let i = 0; i < this.grid.length; i++) {
        const rat = new Rat(this, i);
        this.insertMobileObject(rat);
        rat.setMoveTimeout(
          rat.randomMoveDirections,
          rat.getRandomMoveRandomTimeout()
        );
      }
    }
    
    if (this.details.mobs.cultist) {
      for (let i = 0; i < this.grid.length; i++) {
        const cultist = new Cultist(this, i);
        this.insertMobileObject(cultist);
        cultist.setMoveTimeout(
          cultist.randomMoveDirections,
          cultist.getRandomMoveRandomTimeout()
        );
      }
    }
    
    if (this.details.mobs.giantSpider) {
      const giantSpider = new GiantSpider(this);
      this.insertMobileObject(giantSpider);
      giantSpider.setMoveTimeout(
        giantSpider.randomMoveDirections,
        giantSpider.getRandomMoveRandomTimeout()
      );
    }
    
    if (this.details.mobs.ghost) {
      const ghost = new Ghost(this);
      this.insertMobileObject(ghost);
      ghost.setMoveTimeout(
        ghost.randomMoveDirections,
        ghost.getRandomMoveRandomTimeout()
      );
    }
    
    if (this.details.mobs.banshee) {
      const banshee = new Banshee(this);
      this.insertMobileObject(banshee);
      banshee.setMoveTimeout(
        banshee.randomMoveDirections,
        banshee.getRandomMoveRandomTimeout()
      );
    }
  }
  
  getRoom({ level, room }) {
    if (!Array.isArray(this.grid[level])) return this.grid[level];
    
    return this.grid[level][room];
  }
  
  insertMobileObject(mob) {
    const { level, room } = mob.position;
    const roomObj = this.getRoom({ level, room });
    
    this.mud.mobs[mob.id] = mob;
    roomObj.enter(null, { entity: mob });
    console.log(
      `${mob.kind} inserted at (${mob.position.level}, ${mob.position.room})`
    );
  }
  
  isValidDestinationForm(dest) {
    if (
      typeof dest === "object"
      && (
        typeof dest.position === "object"
        && typeof dest.position.level === "number"
        && typeof dest.position.room === "number"
        && typeof dest.fromDir === "string"
      )
    ) {
      return true;
    } else {
      return false;
    }
  }
  
  isValidDestinationRange(dest) {
    if (
      dest.position.level >= 0
      && dest.position.level < this.grid.length
      && dest.position.room >= 0
      && dest.position.room < this.grid[level].length
    ) {
      return true;
    } else {
      return false;
    }
  }
  
  isValidDestination(dest) {
    if (
      this.isValidDestinationForm(dest)
      && this.isValidDestinationRange(dest)
    ) {
      const level = dest?.position.level;
      const room = dest?.position.room;
      const roomObj = this.getRoom({ level, room });
      
      if (Room.isRoom(roomObj)) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  
  /* moved to Room#getAdjacentRoomLongDirections
  getAdjacentRoomDirections(from, to) {
    if (
      typeof from !== "object"
      || typeof from.level !== "number"
      || typeof from.room !== "number"
    ) throw new Error("Invalid origin");
    
    if (
      typeof to !== "object"
      || typeof to.level !== "number"
      || typeof to.room !== "number"
    ) throw new Error("Invalid destination");
    
    const levelDifference = from.level - to.level;
    const roomDifference = from.room - to.room;
    const width = this.details.width;
    
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
  */
}

module.exports = Maze;
