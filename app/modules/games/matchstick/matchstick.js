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

const getHelp = require("../../commands/chat_input/help.js");

const bot = global.bot;
const admins = global.admins;
const games = global.states.games;

class Matchstick extends Game {
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
    
    this.name = "Matchstick";
    this.turns = 0;
    this.sticks = 21;
    this.players = new Array(2).fill(undefined);
    this.history = [];
    this.isFourMinusNStrategyApplicable = false;
    
    this.players[0] = getUser(msg);
    
    if (isFinite(+args[1]) && +args[1] >= 5) this.sticks = +args[1];
    
    if ((this.sticks - 1) % 4 === 0) this.isFourMinusNStrategyApplicable = true;
    
    if (+args[0] === 1) {
      setTimeout(() => {
        this.singleplayer = true;
        this.players[1] = this.bot.user;
        this.print(
          `${this.players[0].username} has started a ${this.name} game!`
        );
        this.onJoin();
        this.setGameTimeout();
      }, 0);
    } else if (+args[0] === 2 || args[0] === undefined || args[0] === null) {
      setTimeout(() => {
        if (!isDM(msg)) {
          this.print(
            `${this.players[0].username} has started a ${this.name} game, `
            + "waiting for player 2. Type "
            + `\`${getConcisePrefix(msg)}join\``
            + " to join!"
          );
          
          this.setGameTimeout();
        } else {
          this.print(`Cannot start multiplayer ${this.name} game in DM`);
          this.endGame();
        }
      }, 0);
    } else {
      this.printHelpAndQuit(msg);
    }
  }
  
  async printHelpAndQuit(msg) {
    await this.print(
      await getHelp(msg, ["games", "play", "matchstick"])
    );
    setTimeout(() => {
      this.endGame();
    }, 0);
  }
  
  async endGame() {
    this.clearGameTimeout(); //if any
    
    delete this.games[Symbol.for("gamesInProgress")][this.channel.id];
    delete this.games.matchstick[this.channel.id];
    
    updateStatus(this.games, this.bot);
  }
  
  getCurrentPlayer() {
    return this.players[this.turns % this.players.length];
  }
  
  getWhosUp(turns) {
    turns = turns || this.turns;
    
    return this.players[turns % this.players.length].username;
  }
  
  getSticks() {
    return "\\| ".repeat(this.sticks).trim();
  }
  
  async onJoin() {
    let line = `${this.players[1].username} joins!\n`;
    
    line +=
      "Pick up 1-3 matchsticks each turn, but don't pick up the last one! "
      + `${this.getWhosUp()} is up!`
      + "\n"
    ;
    
    line += this.getSticks();
    
    this.started = true;
    
    this.print(line);
  }
  
  async join(msg) {
    const user = getUser(msg);
    
    if (!this.singleplayer) {
      if (
        (this.players[0].id === user.id)
        //&& (!admins.includes(user.id))
      ) return;
      
      this.clearGameTimeout();
      
      this.players[1] = user;
      this.onJoin();
      
      return this.setGameTimeout();
    }
  }
  
  async turn(msg, content) {
    const user = msg ? getUser(msg) : this.bot;
    
    let line = "";
    
    if (
      !this.singleplayer
      || (this.singleplayer && (this.turns % this.players.length === 0))
    ) {
      if (
        user.id !== this.players[this.turns % this.players.length].id
      ) return;
      
      content = +content;
      
      if (
        !isFinite(content)
        || content < 1
        || content > 3
      ) return;
    } else {
      if (this.isFourMinusNStrategyApplicable) {
        content = 4 - this.history[this.history.length - 1];
      } else if (this.sticks <= 4) {
        content = this.sticks - 1;
      } else {
        content = Math.floor(random() * 3) + 1;
      }
    }
    
    if (content > this.sticks) return;
    
    this.clearGameTimeout();
    
    this.history.push(content);
    
    this.sticks -= content;
    
    if (this.votesToKill.length > 0 && this.sticks > 1) {
      line += `${this.getVoteToKillStatus(msg)}\n`;
    }
    
    line += `${this.players[this.turns % this.players.length].username} `
      + `picks up ${content} matchstick`
      + (this.history[this.history.length - 1] > 1 ? "s" : "") + "!"
    ;
    
    if (this.sticks > 1) {
      line += ` ${this.sticks} left! ${this.getWhosUp(this.turns + 1)} is up!`;
    }
    
    if (this.sticks > 0) {
      line += `\n${this.getSticks()}`;
    }
    
    if (this.sticks === 0) {
      line += `\n${this.players[this.turns % this.players.length].username} `
        + "picked up the last matchstick! "
        + `${this.players[(this.turns - 1) % this.players.length].username} `
        + "wins!"
      ;
    } else if (this.sticks === 1) {
      line += `\n${this.players[this.turns % this.players.length].username} `
        + "wins!"
      ;
    }
    
    this.print(line);
    
    if (this.sticks <= 1) return this.endGame();
    
    this.turns++;
    
    this.setGameTimeout();
    
    if (this.singleplayer && (this.turns % this.players.length === 1)) {
      this.turn();
    }
  }
}

module.exports = Matchstick;
