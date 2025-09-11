/*
Copyright (C) 2023, 2024 Nicholas D. Horne

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

const GraphicsMagickCaptcha = require('gm-captcha');

const getUser = require("../helpers/getuser.js");
const isRequestError = require("../helpers/isrequesterror.js");

const { logException } = require("../helpers/loggers.js");

class Game {
  constructor() {
    
  }
  
  async print(content, file) {
    try {
      //await this.channel.createMessage(content, file);
      await bot.createMessage(this.channel.id, content, file);
    } catch (err) {
      logException(err);
      
      if (isRequestError(err)) {
        this.print(content, file);
      }
    }
  }
  
  setGameTimeout(time) {
    time = time || 5;
    
    const gamesInProgress = this.games[Symbol.for("gamesInProgress")];
    
    if (this.channel.id in gamesInProgress) {
      this.timeout = setTimeout(() => {
        if (this.channel.id in gamesInProgress) {
          this.print(`${this.name} game will timeout in ~1 minute.`);
          this.timeout = setTimeout(() => {
            if (this.channel.id in gamesInProgress) {
              this.print(`${this.name} game will timeout in ~30 seconds.`);
              this.timeout = setTimeout(() => {
                if (this.channel.id in gamesInProgress) {
                  this.captcha = new GraphicsMagickCaptcha({
                    width: 250,
                    height: 125,
                    maxTextWidth: 6,
                    wordSpacing: 75,
                    lineCount: 40,
                    lineWidth: 1,
                    pointCount: 1000,
                    fontSize: 100,
                  });
                  
                  this.captcha.gmBuffer(
                    this.captcha.generator(),
                    'PNG',
                    buffer => {
                      this.print(
                        {
                          embeds: [
                            {
                              color: global.embedColor,
                              title: "Haven't figured out your next move?",
                              description:
                                "Enter the captcha below to avert timeout:"
                              ,
                              image: {
                                url: "attachment://captcha.png"
                              },
                            },
                          ],                      
                        },
                        {
                          file: buffer,
                          name: "captcha.png"
                        },
                      );
                    }
                  );
                  
                  this.timeout = setTimeout(() => {
                    if (this.channel.id in gamesInProgress) {
                      this.print(
                        `${this.name} game will timeout in ~15 seconds.`
                      );
                      this.timeout = setTimeout(() => {
                        if (this.channel.id in gamesInProgress) {
                          this.print(`${this.name} game has timed out.`);
                          console.log(
                            new Date().toLocaleString()
                            + `: ${this.name} game has timed out for channel `
                            + this.channel.id
                          );
                          this.endGame();
                        }
                      }, 15 * 1000);
                    }
                  }, 15 * 1000);
                }
              }, 0 * 1000);
            }
          }, 30 * 1000);
        }
      }, (time - 1) * 60 * 1000);
    }
  }
  
  clearGameTimeout() {
    clearTimeout(this.timeout);
    
    if (this.captcha) this.captcha = undefined;
  }
  
  voteToKill(msg) {
    const user = getUser(msg);
    
    if (!this.votesToKill.includes(user.id)) {
        this.votesToKill.push(user.id);
    }
    
    if (this.votesToKill.length < this.players.length) {
      return this.getVoteToKillStatus(msg);
    } else {
      const str = `${this.name} game ${msg.channel.id}`
        + " prematurely terminated by unanimous vote."
      ;
      
      this.endGame();
      
      return str;
    }
  }
  
  getVoteToKillStatus(msg) {
    const votesToKillNeeded = this.players.length - this.votesToKill.length;
    
    return `${this.votesToKill.length} vote`
      + (this.votesToKill.length > 1 ? "s" : "")
      + " to kill game received, "
      + `${votesToKillNeeded} more vote`
      + (votesToKillNeeded > 1 ? "s" : "")
      + ` needed to end game. (\`${getConcisePrefix(msg)}gameover\` to vote)`
    ;
  }
}

module.exports = Game;
