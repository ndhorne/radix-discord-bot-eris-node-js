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

const randomWords = require("random-words");

const Game = require("../game.js");

const isDM = require("../../helpers/isdm.js");
const getUser = require("../../helpers/getuser.js");
const getConcisePrefix = require("../../helpers/getconciseprefix.js");
const updateStatus = require("../../helpers/updatestatus.js");
const getHumanReadableTimeString =
  require("../../helpers/humanreadabletimestring.js")
;

const { logException } = require("../../helpers/loggers.js");

const bot = global.bot;
const games = global.states.games;

class Hangman extends Game {
  constructor(msg, args) {
    super();
    
    this.bot = bot;
    this.games = games;
    this.channel = msg.channel;
    this.timeout;
    this.captcha;
    this.votesToKill = [];
    
    this.started = false;
    this.singleplayer = true;
    
    this.name = "Hangman";
    this.word;
    this.misses = 0;
    this.guesses = [];
    this.alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
    this.isChallenge = false;
    this.win = false;
    this.startTime;
    
    this.players = [getUser(msg)];
    this.player = this.players[0];
    
    this.winMessages = [
      "Congratulations!",
      "Success!",
      "You win!"
    ];
    
    this.loseMessages = [
      "Better luck next time!",
      "Bummer!"
    ];
    
    this.min = (
      (
        isFinite(+args[0])
        && +args[0] >= 2
        && +args[0] <= 14
      )
      ? +args[0]
      : 5
    );
    
    this.max = (
      (
        isFinite(+args[1])
        && +args[1] >= 2
        && +args[1] <= 14
      )
      ? +args[1]
      : 14
    );
    
    if (args[0] === undefined && this.max < this.min) this.min = this.max;
    
    try {
      if (this.min > this.max) throw new Error("Minimum cannot exceed maximum");
      
      if (
        typeof args[0] === "string" && Object.is(+args[0], NaN)
      ) {
        this.isChallenge = true;
        this.word = args[0];
      } else {
        do {
          this.word = randomWords({exactly: 1, maxLength: this.max})[0];
        } while (this.word.length < this.min);
      }
      
      if (!this.isChallenge) {
        setTimeout(() => {
          this.print(
            `${this.player.username} has started a game of ${this.name}!`
          );
          
          this.startGame();
        }, 0);
      } else {
        setTimeout(() => {
          if (!isDM(msg)) {
            this.print(
              `${this.player.username} has created a ${this.name} challenge! `
              + `Type \`${getConcisePrefix(msg)}accept\` to accept!`
            );
            
            this.setGameTimeout();
          } else {
            this.print(`Cannot create a ${this.name} challenge in DM`);
            this.endGame();
          }
        }, 0);
      }
    } catch (err) {
      logException(err);
      this.print(err.message);
      setTimeout(() => this.endGame(), 0);
    }
  }
  
  async endGame() {
    this.clearGameTimeout(); //if any
    
    delete this.games[Symbol.for("gamesInProgress")][this.channel.id];
    delete this.games.hangman[this.channel.id];
    
    updateStatus(this.games, this.bot);
  }
  
  getCurrentPlayer() {
    return this.player;
  }
  
  startGame() {
    this.clearGameTimeout();
    
    this.started = true;
    this.startTime = Date.now();
    
    let line = "Guess a letter or the word!";
    
    line += this.getScaffold();
    
    this.print(line);
    
    this.setGameTimeout();
  }
  
  async accept(msg) {
    const user = getUser(msg);
    
    if (!this.started) {
      this.player = this.players[0] = user;
      
      this.print(`${this.player.username} accepts!`);
      
      this.startGame();
    }
  }
  
  getScaffold() {
    let line = "```\n";
    
    if (this.win) {
      line += "____\n|  |\n|\n| \\o/\n|  |\n| / \\";
    } else {
      switch (this.misses) {
        case 0:
        line += "____\n|  |\n|\n|\n|\n|";
        break;
        
        case 1:
        line += "____\n|  |\n|  o\n|\n|\n|";
        break;
        
        case 2:
        line += "____\n|  |\n|  o\n|  |\n|\n|";
        break;
        
        case 3:
        line += "____\n|  |\n|  o\n| /|\n|\n|";
        break;
        
        case 4:
        line += "____\n|  |\n|  o\n| /|\\\n|\n|";
        break;
        
        case 5:
        line += "____\n|  |\n|  o\n| /|\\\n| /\n|";
        break;
        
        case 6:
        line += "____\n|  |\n|  o\n| /|\\\n| / \\\n|";
        break;
        
        default:
        console.error("Invalid numbers of turns taken");
      }
    }
    
    line += "\n\n";
    
    if (!this.win) {
      this.word.split("").forEach(letter => {
        if (this.guesses.includes(letter)) {
          line += letter;
        } else {
          line += "\_";
        }
      });
    } else {
      line += this.word;
    }
    
    line += "\n";
    
    for (let letter of this.alphabet) {
      if (!this.guesses.includes(letter)) {
        line += letter;
      }
    }
    
    line += "```";
    
    return line;
  }
  
  async turn(msg, content) {
    //const content = msg.content.trim();
    
    let line = "";
    
    if (content.length > 1 && content.length !== this.word.length) return;
    
    if (content.length === 1 && this.guesses.includes(content)) {
      return this.print(`Letter "${content}" already guessed!`);
    }
    
    this.clearGameTimeout();
    
    if (content.length === 1) {
      this.guesses.push(content);
      if (!this.word.includes(content)) this.misses++;
    } else {
      if (content === this.word) {
        this.win = true;
      } else {
        this.misses++;
      }
    }
    
    if (this.word.split("").every(letter => this.guesses.includes(letter))) {
      this.win = true;
    }
    
    line += this.getScaffold();
    
    if (this.win) {
      if (this.misses === 0) {
        line += "Flawless!";
      } else {
        line += this.winMessages[
          Math.floor(Math.random() * this.winMessages.length)
        ];
      }
      
      line += ` Secret word "${this.word}" solved in `
        + getHumanReadableTimeString((Date.now() - this.startTime) / 1000)
        + "!"
      ;
    } else if (this.misses === 6) {
      let unguessed = this.word.split("").filter(letter => {
        return !this.guesses.includes(letter);
      });
      
      if (unguessed.length > 1) {
        line += this.loseMessages[
          Math.floor(Math.random() * this.loseMessages.length)
        ];
      } else {
        line += "So close!";
      }
      
      line += ` Reveal word: ||${this.word}||`;
    }
    
    this.print(line);
    
    if (this.win || this.misses === 6) {
      this.endGame();
    }
    
    if (!this.win && this.misses < 6) this.setGameTimeout();
  }
}

module.exports = Hangman;
