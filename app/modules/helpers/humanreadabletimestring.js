/*
Copyright (C) 2022 Nicholas D. Horne

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

//formats and returns time value in seconds as human readable string
function getHumanReadableTimeString(time) {
  let days, hours, minutes, seconds, result = "";
  
  days = Math.floor(+time / 86400);
  hours = Math.floor(+time % 86400 / 3600);
  minutes = Math.floor(+time % 86400 % 3600 / 60);
  seconds = Math.floor(+time % 86400 % 3600 % 60);
  
  if (days > 0) {
    result += days + " day";
    if (days > 1) result += "s";
  }
  if (hours > 0) {
    result += result ? ", " : "";
    if (minutes === 0 && seconds === 0 && days > 0) result += "and ";
    result += hours + " hour";
    if (hours > 1) result += "s";
  }
  if (minutes > 0) {
    result += result ? ", " : "";
    if (seconds === 0 && (hours > 0 || days > 0)) result += "and ";
    result += minutes + " minute";
    if (minutes > 1) result += "s";
  }
  if (seconds > 0) {
    result += result ? ", " : "";
    if (days > 0 || hours > 0 || minutes > 0) result += "and ";
    result += seconds + " second";
    if (seconds > 1) result += "s";
  }
  
  return result;
}

module.exports = getHumanReadableTimeString;
