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

function getOppositeDirection(dir) {
  let oppositeDir;
  
  switch (dir) {
    case "n":
      oppositeDir = "s";
      break;
    
    case "ne":
      oppositeDir = "sw";
      break;
    
    case "e":
      oppositeDir = "w";
      break;
    
    case "se":
      oppositeDir = "nw";
      break;
    
    case "s":
      oppositeDir = "n";
      break;
    
    case "sw":
      oppositeDir = "ne";
      break;
    
    case "w":
      oppositeDir = "e";
      break;
    
    case "nw":
      oppositeDir = "se";
      break;
    
    case "u":
      oppositeDir = "d";
      break;
    
    case "d":
      oppositeDir = "u";
      break;
    
    default:
      throw new Error("Invalid direction");
    //end cases
  }
  
  return oppositeDir;
}

module.exports = getOppositeDirection;
