/*
Copyright (C) 2023 Nicholas D. Horne

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

const { existsSync, mkdir } = require("fs");

function checkDir(dir) {
  try {
    if (!existsSync(dir)) {
      mkdir(dir, {recursive: true}, (err) => {
        if (err) throw err;
      });
    }
  } catch (err) {
    console.error("Error creating directory:", err);
  }
}

module.exports = checkDir;
