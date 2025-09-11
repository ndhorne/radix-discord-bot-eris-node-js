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

const MobileObject = require("../mobileobject.js");

class Rat extends MobileObject {
  constructor(maze, level, room) {
    super(maze, level, room);
    this.kind = "rat";
    this.stepSound = "scurrying";
    this.randomMoveDirections = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
  }
  
  onPlayerEnter() {
    this.moveRandomDirection(this.randomMoveDirections);
  }
}

module.exports = Rat;
