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

const getHelp = require("../help.js");

//const { readFile } = require("fs");
const { readFile } = require("node:fs/promises");

const getUser = require("../../../helpers/getuser.js");

const { logException } = require("../../../helpers/loggers.js");

const logDir = global.logDir;
const admins = global.admins;

async function getLog(msg, args) {
  function shorten(msgs, arg) {
    const from = (arg === "head" ? 0 : 1);
    const to = (arg === "head" ? -1 : undefined);
    
    while (msgs.length > 2000) {
      msgs = msgs.split("\n").slice(from, to).join("\n");
    }
    
    return msgs;
  }
  
  function getHead(msgs, num = 10) {
    msgs = msgs.split("\n");
    
    return msgs.slice(0, (num > msgs.length ? msgs.length : num)).join("\n");
  }
  
  function getTail(msgs, num = 10) {
    msgs = msgs.split("\n");
    
    return msgs.slice(msgs.length < num ? 0 : -num).join("\n");
  }
  
  const user = getUser(msg);
  
  if (admins.includes(user.id)) {
    switch(args[0]) {
      case "errors":
        return readFile(`${logDir}/errors`, "utf8").then(
          function(result) {
            result = result.trim();
            
            switch(args[1]) {
              case "head":
                result = getHead(result, args[2]);
                break;
              case "tail":
                result = getTail(result, args[2]);
                break;
              //end cases
            }
            
            if (result.length > 2000) {
              result = shorten(result, args[1]);
            }
            
            return result;
          },
          function(err) {
            if (err) {
              if (err.code === "ENOENT") {
                return "No errors";
              } 
              
              throw err;
            }
          }
        ).catch(
          function(err) {
            logException(err);
          }
        );
        
        /*
        readFile(`${logDir}/errors`, "utf8", function(err, errors) {
          try {
            if (err) {
              if (err.code === "ENOENT") {
                return msg.channel.createMessage("No errors");
              } 
              
              throw err;
            }
          } catch (err) {
            logException(err);
          }
          
          try {
            if (errors.length > 2000) {
              errors = shorten(errors);
            }
            
            switch(args[1]) {
              case "head":
                errors = getHead(errors, args[2]);
                break;
              case "tail":
                errors = getTail(errors, args[2]);
                break;
              //end cases
            }
            
            return msg.channel.createMessage(errors);
          } catch (err) {
            logException(err);
          }
        });
        */
        break;
      
      case "messages":
        return readFile(`${logDir}/messages`, "utf8").then(
          function(result) {
            result = result.trim();
            
            switch(args[1]) {
              case "head":
                result = getHead(result, args[2]);
                break;
              case "tail":
                result = getTail(result, args[2]);
                break;
              //end cases
            }
            
            if (result.length > 2000) {
              result = shorten(result, args[1]);
            }
            
            return result;
          },
          function(err) {
            if (err) {
              if (err.code === "ENOENT") {
                return "No messages";
              } 
              
              throw err;
            }
          }
        ).catch(
          function(err) {
            logException(err);
          }
        );
        
        /*
        readFile(`${logDir}/messages`, "utf8", function(err, messages) {
          try {
            if (err) {
              if (err.code === "ENOENT") {
                return msg.channel.createMessage("No messages");
              } 
              
              throw err;
            }
          } catch (err) {
            logException(err);
          }
          
          try {
            if (messages.length > 2000) {
              messages = shorten(messages);
            }
            
            switch(args[1]) {
              case "head":
                messages = getHead(messages, args[2]);
                break;
              case "tail":
                messages = getTail(messages, args[2]);
                break;
              //end cases
            }
            
            return msg.channel.createMessage(messages);
          } catch (err) {
            logException(err);
          }
        });
        */
        break;
      
      case "warnings":
        return readFile(`${logDir}/warnings`, "utf8").then(
          function(result) {
            result = result.trim();
            
            switch(args[1]) {
              case "head":
                result = getHead(result, args[2]);
                break;
              case "tail":
                result = getTail(result, args[2]);
                break;
              //end cases
            }
            
            if (result.length > 2000) {
              result = shorten(result, args[1]);
            }
            
            return result;
          },
          function(err) {
            if (err) {
              if (err.code === "ENOENT") {
                return "No warnings";
              } 
              
              throw err;
            }
          }
        ).catch(
          function(err) {
            logException(err);
          }
        );
        
        /*
        readFile(`${logDir}/warnings`, "utf8", function(err, warnings) {
          try {
            if (err) {
              if (err.code === "ENOENT") {
                return msg.channel.createMessage("No warnings");
              } 
              
              throw err;
            }
          } catch (err) {
            logException(err);
          }
          
          try {
            if (warnings.length > 2000) {
              warnings = shorten(warnings);
            }
            
            switch(args[1]) {
              case "head":
                warnings = getHead(warnings, args[2]);
                break;
              case "tail":
                warnings = getTail(warnings, args[2]);
                break;
              //end cases
            }
            
            return msg.channel.createMessage(warnings);
          } catch (err) {
            logException(err);
          }
        });
        */
        break;
      
      case "exceptions":
        return readFile(`${logDir}/exceptions`, "utf8").then(
          function(result) {
            result = result.trim();
            
            switch(args[1]) {
              case "head":
                result = getHead(result, args[2]);
                break;
              case "tail":
                result = getTail(result, args[2]);
                break;
              //end cases
            }
            
            if (result.length > 2000) {
              result = shorten(result, args[1]);
            }
            
            return result;
          },
          function(err) {
            if (err) {
              if (err.code === "ENOENT") {
                return "No exceptions";
              } 
              
              throw err;
            }
          }
        ).catch(
          function(err) {
            logException(err);
          }
        );
        
        /*
        readFile(`${logDir}/exceptions`, "utf8", function(err, exceptions) {
          try {
            if (err) {
              if (err.code === "ENOENT") {
                return msg.channel.createMessage("No exceptions");
              } 
              
              throw err;
            }
          } catch (err) {
            logException(err);
          }
          
          try {
            if (exceptions.length > 2000) {
              exceptions = shorten(exceptions);
            }
            
            switch(args[1]) {
              case "head":
                exceptions = getHead(exceptions, args[2]);
                break;
              case "tail":
                exceptions = getTail(exceptions, args[2]);
                break;
              //end cases
            }
            
            return msg.channel.createMessage(exceptions);
          } catch (err) {
            logException(err);
          }
        });
        */
        break;
      
      default:
        return await getHelp(msg, ["admin", "logs"]);
      //end cases
    }
  } else {
    return await getHelp(msg, ["admin"]);
  }
}

module.exports = getLog;
