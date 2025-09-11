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

function getLongDirection(dir) {
  let longDir;
  
  switch (dir) {
    case "n":
      longDir = "north";
      break;
    
    case "ne":
      longDir = "northeast";
      break;
    
    case "e":
      longDir = "east";
      break;
    
    case "se":
      longDir = "southeast";
      break;
    
    case "s":
      longDir = "south";
      break;
    
    case "sw":
      longDir = "southwest";
      break;
    
    case "w":
      longDir = "west";
      break;
    
    case "nw":
      longDir = "northwest";
      break;
    
    case "u":
      longDir = "level above";
      break;
    
    case "d":
      longDir = "level below";
      break;
    
    default:
      throw new Error("Invalid direction");
    //end cases
  }
  
  return longDir;
}

module.exports = getLongDirection;
