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

const Game = require("../game.js");

const isDM = require("../../helpers/isdm.js");
const random = require("../../helpers/random.js");
const getUser = require("../../helpers/getuser.js");
const getConcisePrefix = require("../../helpers/getconciseprefix.js");
const updateStatus = require("../../helpers/updatestatus.js");
const getHumanReadableTimeString =
  require("../../helpers/humanreadabletimestring.js")
;

const { readFile } = require("node:fs/promises");
const { logException } = require("../../helpers/loggers.js");

const bot = global.bot;
const games = global.states.games;
const data = global.data.randomactsofascii;

class RandomActsOfAscii extends Game {
  constructor(msg, args) {
    super();
    
    this.bot = bot;
    this.games = games;
    this.channel = msg.channel;
    this.timeout;
    this.captcha;
    this.votesToKill = [];
    
    this.started = false;
    this.singleplayer = false;
    
    this.name = "Random Acts of ASCII";
    this.phrase;
    this.phrases = data.phrases.english;
    this.challenge;
    this.index;
    this.previousIndices = [];
    this.startTime;
    this.state;
    this.hint;
    this.hintRequests = [];
    this.current = 1;
    this.total;
    this.players = [];
    this.scoreboard = new Map();
    
    this.players.push(getUser(msg));
    
    if (typeof args[1] === "string") args[1] = args[1].toLowerCase();
    
    this.singleplayer = args[1] === "false" ? false : !!args[1];
    
    this.total = (isFinite(+args[0]) && +args[0] < this.phrases.length)
      ? +args[0]
      : 10
    ;
    
    setTimeout(() => {
      this.print(
        this.players[0].username
        + ` has started a game of ${this.name}`
        + (!this.singleplayer ? ", waiting for players." : ".")
        + " Type "
        + (
          !this.singleplayer
          ? (
            `\`${getConcisePrefix(msg)}join\` to join, `
            + `\`${getConcisePrefix(msg)}start\` to start `
            + `(${this.players[0].username} only), and `
          )
          : ""
        )
        + `\`${getConcisePrefix(msg)}hint\` for hints!`
      );
      
      this.setGameTimeout();
      
      if (this.singleplayer) this.startGame();
    }, 0);
    
    /* replaced with single shared phrases reference
    this.initPhrases().then(result => {
      this.phrases = result.english;
      
      this.total = (isFinite(+args[0]) && +args[0] < this.phrases.length)
        ? +args[0]
        : 10
      ;
      
      this.print(
        this.players[0].username
        + ` has started a game of ${this.name}`
        + (!this.singleplayer ? ", waiting for players." : ".")
        + " Type "
        + (
          !this.singleplayer
          ? (
            `\`${getConcisePrefix(msg)}join\` to join, `
            + `\`${getConcisePrefix(msg)}start\` to start `
            + `(${this.players[0].username} only), and `
          )
          : ""
        )
        + `\`${getConcisePrefix(msg)}hint\` for hints!`
      );
      
      this.setGameTimeout();
      
      if (this.singleplayer) this.startGame();
    });
    */
  }
  
  async printHelpAndQuit(msg) {
    await this.print(
      await getHelp(msg, ["games", "play", "randomactsofascii"])
    );
    setTimeout(() => {
      this.endGame();
    }, 0);
  }
  
  async endGame() {
    this.clearGameTimeout(); //if any
    
    delete this.games[Symbol.for("gamesInProgress")][this.channel.id];
    delete this.games.randomactsofascii[this.channel.id];
    
    updateStatus(this.games, this.bot);
  }
  
  async onJoin(msg) {
    const user = getUser(msg);
    
    this.print(`${user.username} joins!`);
  }
  
  async join(msg) {
    const user = getUser(msg);
    
    if (!this.singleplayer) {
      if (
        this.started
        || this.players.find(u => u.id === user.id)
      ) return;
      
      this.clearGameTimeout();
      
      this.players.push(user);
      this.onJoin(msg);
      
      return this.setGameTimeout();
    }
  }
  
  randomizeString(
    strArg, delimiters = [" ", "-"], exclusions = [], passes = 1
  ) {
    let delimiter = delimiters.shift();
    let strArray = strArg.split(delimiter);
    
    for (let i = 0; i < passes; i++) {
      strArray = strArray.map(strElem => {
        if (delimiters[0] ? !strElem.includes(delimiters[0]) : true) {
          let charArray = strElem.split("");
          
          for (let i = 0; i < charArray.length; i++) {
            let randomIndex, temp;
            
            if (exclusions.includes(charArray[i])) {
              continue;
            }
            
            do {
              randomIndex = Math.floor(random() * charArray.length);
            } while (exclusions.includes(charArray[randomIndex]));
            
            temp = charArray[i];
            charArray[i] = charArray[randomIndex];
            charArray[randomIndex] = temp;
          }
          
          return charArray.join("");
        } else {
          return this.randomizeString(strElem, delimiters, exclusions);
        }
      });
    }
    
    return strArray.join(delimiter);
  }
  
  isFullyRandom(str1, str2, delimiter = " ", exclusions = []) {
    if (typeof str1 != "string" || typeof str2 != "string") {
      throw new Error("Arguments must both be of type string");
    }
    if (str1.length != str2.length) {
      throw new Error("Arguments must be of equal length");
    }
    
    let str1Array = str1.split(delimiter);
    let str2Array = str2.split(delimiter);
    
    outer: for (let i = 0; i < str1Array.length; i++) {
      if (str1Array[i].length == 1) {
        continue;
      }
      
      let occurences = {}, halfLength = str1Array[i].length / 2;;
      Array.prototype.forEach.call(str1Array[i], function(char) {
        occurences[char] = (occurences[char] || 0) + 1;
      });
      
      for (let char in occurences) {
        if (occurences[char] > halfLength) {
          if (str1Array[i] == str2Array[i]) {
            return false;
          } else {
            continue outer;
          }
        }
      }
      
      for (let j = 0; j < str1Array[i].length; j++) {
        if (str1Array[i][j] == str2Array[i][j]) {
          if (exclusions.includes(str1Array[i][j])) {
            continue;
          } else {
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  setChallenge(indexArg) {
    if (
      typeof indexArg != "number"
      || indexArg < 0
      || indexArg >= this.phrases.length
    ) {
      if (this.previousIndices.length == this.phrases.length) {
        console.log("Phrases exhausted, starting over");
        this.previousIndices = [];
      }
      
      do {
        this.index = Math.floor(random() * this.phrases.length);
      } while (this.previousIndices.includes(this.index));
      
      this.previousIndices.push(this.index);
    } else {
      this.index = indexArg;
    }
    
    this.phrase = this.phrases[this.index]
      .phrase
      .toLowerCase()
      .trim()
      .replace(/ {2,}/g, " ")
    ;
    
    this.hint = this.phrases[this.index].hint;
    
    do {
      this.challenge = this.randomizeString(this.phrase);
    } while (!this.isFullyRandom(this.phrase, this.challenge, " ", ["-"]));
    
    this.state = 0;
    this.startTime = Date.now();
  }
  
  startChallenge() {
    try {
      this.clearGameTimeout();
      
      this.setChallenge();
      
      this.hintRequests = [];
      
      let line =
        "Can you unscramble this common expression?"
        + (this.total > 1 ? ` (${this.current} of ${this.total})` : "")
        + "\n"
      ;
      
      line += this.challenge;
      
      this.print(line);
      
      this.setGameTimeout();
    } catch (e) {
      logException(e);
    }
  }
  
  startGame(msg) {
    try {
      if (this.players.length === 1) this.singleplayer = true;
      
      if (isDM(msg) && !this.singleplayer) {
        this.print(`Cannot create a multiplayer ${this.name} game in DM`);
        this.endGame();
      } else {
        this.players.forEach(player => this.scoreboard.set(player, 0));
        this.started = true;
        
        this.startChallenge();
      }
    } catch (e) {
      logException(e);
    }
  }
  
  getHint(msg) {
    const user = getUser(msg);
    
    this.clearGameTimeout();
    
    if (!this.hintRequests.includes(user.id)) {
        this.hintRequests.push(user.id);
    }
    
    if (this.hintRequests.length < this.players.length) {
      const hintRequestsNeeded = this.players.length - this.hintRequests.length;
      
      this.print(
        `${this.hintRequests.length} hint request`
        + (this.hintRequests.length > 1 ? "s" : "")
        + " received, "
        + `${hintRequestsNeeded} more request`
        + (hintRequestsNeeded > 1 ? "s" : "")
        + ` needed for hint. (\`${getConcisePrefix(msg)}hint\` for hints)`
      );
    } else {
      this.print(`Hint: ${this.hint}`);
    }
    
    this.setGameTimeout();
  }
  
  async validate(msg, content) {
    const user = getUser(msg);
    
    this.clearGameTimeout();
    
    const response = content.toLowerCase().trim().replace(/ {2,}/g, " ");
    
    const player = this.players.find(u => u.id === user.id);
    
    let line = "";
    
    if (this.votesToKill.length > 0 && this.current < this.total) {
      line += `${this.getVoteToKillStatus(msg)}\n`;
    }
    
    if (response === this.phrase) {
      this.state = 1;
      
      this.scoreboard.set(player, this.scoreboard.get(player) + 1);
      
      const winStr =
        user.username
        + " solved "
        + "\""
        //+ this.phrase[0].toUpperCase()
        //+ this.phrase.slice(1)
        + this.phrase
        + "\""
        + " in "
        + getHumanReadableTimeString(
          (((Date.now() - this.startTime) / 1000).toFixed(2))
        )
        + "!"
      ;
      
      line +=
        winStr
        + (
          this.total > 1
          ? (
            this.current < this.total
            ? (
              this.current + 1 < this.total
              ? " Next challenge!"
              : " Final challenge!"
            )
            : (
              !this.singleplayer
              ? " Results:"
              : " Challenges exhausted!"
            )
          )
          : ""
        )
      ;
      
      if (this.current < this.total) {
        this.current++;
        this.print(line);
        return this.startChallenge();
      } else {
        if (!this.singleplayer) {
          const sortedScoreboard = new Map(
            [...this.scoreboard.entries()].sort((a, b) => {
              //return b[1] - a[1];
              return a > b ? -1 : (a < b ? 1 : 0);
            })
          );
          
          const longestNameLength = this.players.reduce((max, current) => {
            if (current.username.length > max) return current.username.length;
          }, 0);
          
          const playersSortedByScore = [...sortedScoreboard.keys()];
          const topScore = sortedScoreboard.get(playersSortedByScore[0]);
          
          const topScorers = playersSortedByScore.filter(
            player => sortedScoreboard.get(player) === topScore
          );
          
          let result = "";
          
          result += "```\n"
          result += "Scoreboard\n\n";
          sortedScoreboard.forEach((value, key) => {
            result +=
              " ".repeat(longestNameLength - key.username.length)
              + `${key.username}: ${value}\n`
            ;
          });
          result += "\n```";
          
          result.trim();
          
          line += result;
          
          if (topScorers.length === 1) {
            line += `${topScorers[0].username} wins!`;
          } else {
            topScorers.forEach(function (player, index) {
              line += player.username
                + (index + 2 < topScorers.length ? ", " : " ")
                + (index + 2 === topScorers.length ? "and " : "")
              ;
            });
            
            line += "tie for first!";
          }
        }
        
        this.print(line);
        
        return this.endGame();
      }
    }
    
    this.setGameTimeout();
  }
  
  /* replaced with single shared phrases reference
  async initPhrases() {
    try {
      let jsonPhrases = await readFile(`${__dirname}/phrases.json`, "utf8");
      let phrases = JSON.parse(jsonPhrases);
      
      return phrases;
    } catch (e) {
      logException(e);
    }
  }
  */
}

module.exports = RandomActsOfAscii;
