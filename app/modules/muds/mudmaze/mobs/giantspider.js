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

const { readFileSync } = require("fs");

const MobileObject = require("../mobileobject.js");

const print = require("../../../helpers/print.js");
const getDMChannel = require("../../../helpers/getdmchannel.js");

const relay = require("../relay.js");

const baseDir = global.baseDir;

class GiantSpider extends MobileObject {
  constructor(maze, level, room) {
    super(maze, level, room);
    this.kind = "giant spider";
    this.stepSound = "clicking";
    this.encountered = false;
    this.strings = JSON.parse(
      readFileSync(`${baseDir}/assets/mudmaze/json/strings/giantspider.json`)
    );
  }
  
  async performEncounterTasks(playerData) {
    if (!this.encountered) {
      this.clearMoveTimeout();
      this.encountered = true;
      
      playerData.flags.isCaptive = true;
      
      let roomObj = this.getCurrentRoom();
      
      const channel = await getDMChannel(playerData.userObj.id);
      
      let str = this.strings.encounter.player
      
      await print(channel, str);
      
      const players = roomObj.players.toArray().filter(
        (player) => player.id !== playerData.userObj.id
      );
      
      if (players.length > 0) {
        const username = playerData.userObj.username;
        
        str = this.strings.encounter.bystander.replace("${username}", username);
        
        relay(players, str);
      }
      
      //remove giant spider
      delete roomObj.mobs[this.id];
      delete this.maze.mud.mobs[this.id];
      
      roomObj.exit(null, { entity: playerData});
      
      roomObj = this.maze.getRoom(this.maze.details.spawn);
      
      roomObj.enter(null, { entity: playerData, stepSound: "a loud thud" });
      
      //insert new giant spider
      const giantSpider = new GiantSpider(this.maze);
      
      this.maze.insertMobileObject(giantSpider);
      giantSpider.setMoveTimeout(
        giantSpider.randomMoveDirections,
        giantSpider.getRandomMoveRandomTimeout()
      );
    }
  }
  
  onPlayerEnter(playerData) {
    this.performEncounterTasks(playerData);
  }
}

module.exports = GiantSpider;
