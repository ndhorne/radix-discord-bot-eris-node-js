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

const { readFileSync } = require("fs");

const dir = global.baseDir;

function initData() {
  return {
    notwordle: {
      fiveLetterWordsCommon: JSON.parse(
        readFileSync(`${dir}/assets/notwordle/json/fiveletterwordscommon.json`)
      ),
      fiveLetterWords: JSON.parse(
        readFileSync(`${dir}/assets/notwordle/json/fiveletterwords.json`)
      ),
      wordleWords: JSON.parse(
        readFileSync(`${dir}/assets/notwordle/json/wordlewords.json`)
      ),
    },
    randomactsofascii: {
      phrases: JSON.parse(
        readFileSync(`${dir}/assets/randomactsofascii/json/phrases.json`)
      ),
    },
    fortunes: {
      joshmadison: JSON.parse(
        readFileSync(`${dir}/assets/fortunes/json/joshmadison.json`)
      ),
    },
  };
}

module.exports = initData;
