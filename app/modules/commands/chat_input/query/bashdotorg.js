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

const HTMLParser = require("node-html-parser");

const { logMessage, logException } = require("../../../helpers/loggers.js");

async function getBashDotOrgQuote(msg, args) {
  const url = "http://bash.org/?random1";
  
  try {
    const response = await fetch(url);
    
    if (response.ok) {
      const body = await response.text();
      const parsed = HTMLParser.parse(body);
      const element = parsed.querySelector(".qt");
      const quote = element.text;
      
      return quote;
    } else {
      logMessage(`Error connecting to ${url}`);
    }
  } catch (err) {
    logException(err);
  }
}

module.exports = getBashDotOrgQuote;
