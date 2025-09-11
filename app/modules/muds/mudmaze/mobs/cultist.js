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

const { readFileSync } = require("fs");

const MobileObject = require("../mobileobject.js");

const print = require("../../../helpers/print.js");
const getDMChannel = require("../../../helpers/getdmchannel.js");

const relay = require("../relay.js");

const baseDir = global.baseDir;

class Cultist extends MobileObject {
  constructor(maze, level, room) {
    super(maze, level, room);
    this.kind = "cultist";
    this.stepSound = "chanting";
    this.randomMoveDirections = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
    this.encountered = false;
    this.strings = JSON.parse(
      readFileSync(`${baseDir}/assets/mudmaze/json/strings/cultist.json`)
    );
  }
  
  async performEncounterTasks(playerData) {
    if (!this.encountered) {
      this.clearMoveTimeout();
      this.encountered = true;
      
      const {
        beforeLoseMapText,
        loseMapText,
        keepMapText,
        afterLoseMapText,
      } = this.strings.encounter.player;
      
      const loseMap = Math.random() < 0.5 ? true : false;
      
      let str = (
        beforeLoseMapText
        + (
          loseMap
          ? loseMapText
          : keepMapText
        )
        + afterLoseMapText
      );
      
      if (loseMap) playerData.automap = this.maze.mud.initAutomap();
      
      const roomObj = this.getCurrentRoom();
      
      delete roomObj.mobs[this.id];
      delete this.maze.mud.mobs[this.id];
      
      const channel = await getDMChannel(playerData.userObj.id);
      
      print(channel, str);
      
      const players = roomObj.players.toArray().filter(
        (player) => player.id !== playerData.userObj.id
      );
      
      if (players.length > 0) {
        const username = playerData.userObj.username;
        
        str = this.strings.encounter.bystander.replace("${username}", username);
        
        relay(players, str);
      }
      
      const cultist = new Cultist(this.maze, roomObj.z);
      
      this.maze.insertMobileObject(cultist);
      cultist.setMoveTimeout(
        cultist.randomMoveDirections,
        cultist.getRandomMoveRandomTimeout()
      );
    }
  }
  
  onPlayerEnter(playerData) {
    this.performEncounterTasks(playerData);
  }
}

module.exports = Cultist;
