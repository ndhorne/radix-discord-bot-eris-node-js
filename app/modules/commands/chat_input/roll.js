/*
Copyright (C) 2022, 2023 Nicholas D. Horne

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

const { CommandInteraction } = require("eris");

const random = require("../../helpers/random.js");
const getHelp = require("./help.js");

async function roll(msg, args) {
  function roll(sides) {
    if (isFinite(+sides)) {
      sides = +sides;
      
      return sides !== 10
        ? Math.floor(random() * sides) + 1
        : Math.floor(random() * sides)
      ;
    }
    
    if (sides === "%") {
      return (Math.floor(random() * 10) + 1) * 10;
    }
  }
  
  function getNumberOfDx(arg) {
    if (/^\d+d(\d+|%)$/.test(arg)) return parseInt(arg); else return 1;
  }
  
  function getDx(arg) {
    if (/^\d+d(\d+|%)$/.test(arg)) {
      return arg.substr(parseInt(arg).toString().length);
    } else {
      return arg;
    }
  }
  
  if (args.length === 1 && msg instanceof CommandInteraction) {
    args = args[0].trim().split(" ");
  }
  
  const validDice =
    ["d2", "d3", "d4", "d6", "d8", "d10", "d12", "d20", "d100", "d%"]
  ;
  
  let str = "";
  
  if (args.length === 0 && msg instanceof CommandInteraction) {
    for (let i = 0; i < 2; i++) {
      str += "d6:" + roll(6) + " ";
    }
    
    return `${str.trim()}`;
  }
  
  if (
    args.length === 0
    || (
      !args.every(arg => {
        return /^\d*d(\d+|%)$/.test(arg) && validDice.includes(getDx(arg));
      })
    )
  ) {
    return await getHelp(msg, ["roll"]);
  }
  
  args.forEach(function(arg) {
    const numberOfDx = getNumberOfDx(arg);
    const sides = getDx(arg).substr(1);
    
    let total = 0;
    
    for (let i = 0; i < numberOfDx; i++) total += roll(sides);
    
    str += (numberOfDx > 1 ? numberOfDx : "") + getDx(arg) + ":" + total;
    //str += "d" + sides + ":" + roll(sides);
    str += (sides === "%" ? "% " : " ");
  });
  
  return `${str.trim()}`;
}

module.exports = roll;
