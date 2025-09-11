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

const { appendFile } = require("fs");

const getHumanReadableTimeString =
  require("../helpers/humanreadabletimestring.js")
;

const logDir = global.logDir;

async function logError(
  err = new Error("Error undefined"), id = "?", eventSource, uptime
) {
  try {
    if (err === null) err = new Error("Error null");
    
    appendFile(
      `${logDir}/errors`,
      `${new Date().toLocaleString()} ${id} ${err.name}: ${err.message} `
      + `EvtSrc: ${eventSource}`
      + (uptime ? ` Uptime: ${getHumanReadableTimeString(uptime / 1000)}` : "")
      + "\n",
      "utf8",
      function(err) {
        try {
          if (err) throw err;
          console.log(`Error logged to ${logDir}/errors`);
        } catch (err) {
          console.error(`Error writing to ${logDir}/errors:`, err);
          logException(err);
        }
      }
    );
    
    console.error(id, err);
  } catch (err) {
    logException(err);
  }
}

async function logWarning(msg, id) {
  try {
    appendFile(
      `${logDir}/warnings`,
      `${new Date().toLocaleString()} ${id.valueOf()} ${msg}\n`,
      "utf8",
      function(err) {
        try {
          if (err) throw err;
          console.log(`Warning logged to ${logDir}/warnings`);
        } catch (err) {
          console.error(`Error writing to ${logDir}/warnings:`, err);
          logException(err);
        }
      }
    );
    
    console.warn(id, msg);
  } catch (err) {
    logException(err);
  }
}

async function logMessage(msg) {
  try {
    appendFile(
      `${logDir}/messages`,
      `${new Date().toLocaleString()} ${msg}\n`,
      "utf8",
      function(err) {
        try {
          if (err) throw err;
          console.log(`Message logged to ${logDir}/messages`);
        } catch (err) {
          console.error(`Error writing to ${logDir}/messages:`, err);
          logException(err);
        }
      }
    );
    
    console.log(msg);
  } catch (err) {
    logException(err);
  }
}

async function logException(err = new Error("Error undefined")) {
  try {
    if (err === null) err = new Error("Error null");
    
    appendFile(
      `${logDir}/exceptions`,
      `${new Date().toLocaleString()} ${err.name}: ${err.message}\n`,
      "utf8",
      function(err) {
        try {
          if (err) throw err;
          console.log(`Exception logged to ${logDir}/exceptions`);
        } catch (err) {
          console.error(`Exceptionception: ${err.name}: ${err.message}`);
          console.error(`Error writing to ${logDir}/exceptions:`, err);
        }
      }
    );
    
    console.error("Exception caught:", err);
  } catch (err) {
    console.error("Erroneous exception data:", err);
  }
}

async function logDebug(msg, id) {
  try {
    appendFile(
      `${logDir}/debug`,
      `${new Date().toLocaleString()} ${id} ${msg}\n`,
      "utf8",
      function(err) {
        try {
          if (err) throw err;
          console.log(`Debug info logged to ${logDir}/debug`);
        } catch (err) {
          console.error(`Error writing to ${logDir}/debug:`, err);
          logException(err);
        }
      }
    );
    
    console.log(id, msg);
  } catch (err) {
    logException(err);
  }
}

exports.logError = logError;
exports.logWarning = logWarning;
exports.logMessage = logMessage;
exports.logException = logException;
exports.logDebug = logDebug;
