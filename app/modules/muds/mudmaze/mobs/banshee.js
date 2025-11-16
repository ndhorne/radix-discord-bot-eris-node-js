/*
Copyright (C) 2025 Nicholas D. Horne

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

const { readFileSync } = require("fs");

const MobileObject = require("../mobileobject.js");

const print = require("../../../helpers/print.js");
const random = require("../../../helpers/random.js");
const getDMChannel = require("../../../helpers/getdmchannel.js");

const relay = require("../relay.js");

const baseDir = global.baseDir;

class Banshee extends MobileObject {
  constructor(maze, level, room) {
    super(maze, level, room);
    this.kind = "banshee";
    this.stepSound = "wailing";
    this.randomMoveDirections = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
    this.strings = JSON.parse(
      readFileSync(`${baseDir}/assets/mudmaze/json/strings/banshee.json`)
    );
  }
  
  async performEncounterTasks(players) {
    this.clearMoveTimeout();
    
    let str = this.strings.encounter.player.actionText;
    
    relay(players, str);
    
    players.forEach(async (player) => {
      const disorient = random() < 0.75 ? true : false;
      const playerData = this.maze.mud.players[player.id];
      const channel = await getDMChannel(playerData.userObj.id);
      
      if (disorient) {
        clearTimeout(playerData.timeouts.disoriented);
        
        playerData.flags.isDisoriented = true;
        
        str = this.strings.encounter.player.startStatusText;
        
        playerData.timeouts.disoriented = setTimeout(
          () => {
            playerData.flags.isDisoriented = false;
            playerData.timeouts.disoriented = null;
            
            const str = this.strings.encounter.player.stopStatusText;
            
            print(channel, str);
          },
          (30 * 1000) + (Math.floor(random() * (30 + 1)) * 1000)
        );
      } else {
        str = this.strings.encounter.player.failText;
      }
      
      print(channel, str);
      
      str = this.strings.encounter.player.postEncounterText;
      
      print(channel, str);
    });
    
    //remove banshee
    const roomObj = this.getCurrentRoom();
    
    delete roomObj.mobs[this.id];
    delete this.maze.mud.mobs[this.id];
    
    //insert new banshee
    const banshee = new Banshee(this.maze, roomObj.z);
    
    this.maze.insertMobileObject(banshee);
    banshee.setMoveTimeout(
      banshee.randomMoveDirections,
      banshee.getRandomMoveRandomTimeout()
    );
    
    //previous post encounter behavior
    /*
    this.setMoveTimeout(
      this.randomMoveDirections,
      0
    );
    */
  }
  
  onPlayerEnter(playerData) {
    const { level, room } = playerData.position;
    const players = this.maze.getRoom({ level, room }).players.toArray();
    
    this.performEncounterTasks(players);
  }
}

module.exports = Banshee;
