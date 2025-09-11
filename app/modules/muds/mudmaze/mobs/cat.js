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

const Room = require("../room.js");
const MobileObject = require("../mobileobject.js");

const getLongDirection = require("../getlongdir.js");

class Cat extends MobileObject {
  constructor(maze, level, room) {
    super(maze, level, room);
    this.kind = "cat";
    this.stepSound = "faint footfalls";
  }
  
  performTasksInCommonPlayerQuitPlayerEscape() {
    const roomObj = this.getCurrentRoom();
    const players = roomObj.players.toArray();
    
    this.clearMoveTimeout();
    
    if (players.length === 0) {
      this.setMoveTimeout(
        this.randomMoveDirections,
        this.getRandomMoveRandomTimeout()
      );
    }
  }
  
  onPlayerEnter(playerData) {
    if (!playerData.flags.isAway) this.clearMoveTimeout();
  }
  
  onPlayerExit(playerData) {
    if (!playerData.flags.isAway) this.clearMoveTimeout();
    
    if (!playerData.flags.hasEscaped && !playerData.flags.isCaptive) {
      let { level, room } = this.position;
      const roomObj = this.maze.getRoom({ level, room });
      
      if (roomObj.players.toArray().length === 0 || Math.random() < 0.5) {
        const moveHistory = playerData.history.move;
        const lastMove = moveHistory[moveHistory.length - 1];
        let toDir, fromDir;
        
        if (lastMove) {
          if (!roomObj.exits[lastMove].isEscape) {
            if (roomObj.exits[lastMove].dest) {
              const dest = roomObj.exits[lastMove].dest;
              
              if (this.maze.isValidDestination(dest)) {
                toDir = getLongDirection(lastMove);
                fromDir = dest.fromDir;
              } else {
                throw new Error("Invalid destination");
              }
            } else {
              ({ toDir, fromDir } = (
                  roomObj.getAdjacentRoomLongDirections(playerData.position)
              ));
            }
            
            ({ level, room } = playerData.position);
            const destRoom = this.maze.getRoom({ level, room });
            
            if (Room.isRoom(destRoom)) {
              if (roomObj !== destRoom) {
                roomObj.exit(null, { entity: this, toDir });
                destRoom.enter(null, { entity: this, fromDir });
              }
            }
          }
        }
      }
    }
  }
  
  onPlayerAway() {
    const roomObj = this.getCurrentRoom();
    const players = roomObj.players.toArray();
    
    this.clearMoveTimeout();
    
    if (
      players.every((player) => this.maze.mud.players[player.id].flags.isAway)
    ) {
      this.setMoveTimeout(
        this.randomMoveDirections,
        this.getRandomMoveRandomTimeout()
      );
    }
  }
  
  onPlayerQuit() {
    this.performTasksInCommonPlayerQuitPlayerEscape();
  }
  
  onPlayerEscape() {
    this.performTasksInCommonPlayerQuitPlayerEscape();
  }
}

module.exports = Cat;
