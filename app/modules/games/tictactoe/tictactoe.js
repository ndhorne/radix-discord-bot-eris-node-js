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

class TicTacToe extends Game {
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
    
    this.name = "Tic Tac Toe";
    this.turns = 0;
    this.width = 3;
    this.height = 3;
    this.grid = new Array(this.width * this.height).fill(undefined);
    this.players = new Array(2).fill(undefined);
    this.moves = [];
    
    this.players[0] = getUser(msg);
    
    if (+args[0] === 1) {
      setTimeout(() => {
        this.singleplayer = true;
        this.players[1] = this.bot.user;
        this.print(
          `${this.players[0].username} has started a game of ${this.name}!`
        );
        this.onJoin();
        this.setGameTimeout();
      }, 0);
    } else if (+args[0] === 2 || args[0] === undefined || args[0] === null) {
      setTimeout(() => {
        if (!isDM(msg)) {
          this.print(
            `${this.players[0].username} has started a game of ${this.name}, `
            + "waiting for player O. Type "
            + `\`${getConcisePrefix(msg)}join\``
            + " to join!"
          );
          
          this.setGameTimeout();
        } else {
          this.print(`Cannot start a multiplayer ${this.name} game in DM`);
          this.endGame();
        }
      }, 0);
    } else {
      this.printHelpAndQuit(msg);
    }
  }
  
  async printHelpAndQuit(msg) {
    await this.print(
      await getHelp(msg, ["games", "play", "tictactoe"])
    );
    setTimeout(() => this.endGame(), 0);
  }
  
  async endGame() {
    this.clearGameTimeout(); //if any
    
    delete this.games[Symbol.for("gamesInProgress")][this.channel.id];
    delete this.games.tictactoe[this.channel.id];
    
    updateStatus(this.games, this.bot);
  }
  
  getCurrentPlayer() {
    return this.players[this.turns % this.players.length];
  }
  
  getGrid() {
    let str =
      "``` 1 | 2 | 3\n-----------\n 4 | 5 | 6\n-----------\n 7 | 8 | 9```"
    ;
    
    this.grid.forEach(function(value, index) {
      if (value) {
        str = str.replace(++index, value);
      }
    });
    
    return str;
  }
  
  async onJoin() {
    let line = "";
    
    line += `${this.players[1].username} joins!\n`;
    line += "Line up three in a row in any direction!";
    line += this.getGrid();
    line +=`${this.players[this.turns % this.players.length].username} is up!`;
    
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
  
  isWon() {
    if (
      (
        ((this.grid[0] === this.grid[1]) && (this.grid[1] === this.grid[2]))
        && (this.grid[0] && this.grid[1] && this.grid[2])
      )
      || (
        ((this.grid[3] === this.grid[4]) && (this.grid[4] === this.grid[5]))
        && (this.grid[3] && this.grid[4] && this.grid[5])
      )
      || (
        ((this.grid[6] === this.grid[7]) && (this.grid[7] === this.grid[8]))
        && (this.grid[6] && this.grid[7] && this.grid[8])
      )
      || (
        ((this.grid[0] === this.grid[3]) && (this.grid[3] === this.grid[6]))
        && (this.grid[0] && this.grid[3] && this.grid[6])
      )
      || (
        ((this.grid[1] === this.grid[4]) && (this.grid[4] === this.grid[7]))
        && (this.grid[1] && this.grid[4] && this.grid[7])
      )
      || (
        ((this.grid[2] === this.grid[5]) && (this.grid[5] === this.grid[8]))
        && (this.grid[2] && this.grid[5] && this.grid[8])
      )
      || (
        ((this.grid[0] === this.grid[4]) && (this.grid[4] === this.grid[8]))
        && (this.grid[0] && this.grid[4] && this.grid[8])
      )
      || (
        ((this.grid[2] === this.grid[4]) && (this.grid[4] === this.grid[6]))
        && (this.grid[2] && this.grid[4] && this.grid[6])
      )
    ) return true;
    
    return false;
  }
  
  async move(msg, content) {
    const user = msg ? getUser(msg) : this.bot;
    
    let index, line = "";
    
    //stops player from taking additional turns before this.turns is incremented
    if (
      (
        (this.grid[this.moves[this.moves.length - 1]])
        === ((this.turns) % this.players.length === 0 ? "X" : "O")
      )
    ) return;
    
    if (
      !this.singleplayer
      || (this.singleplayer && (this.turns % this.players.length === 0))
    ) {
      content = +content;
      
      if (
        user.id !== this.players[this.turns % this.players.length].id
      ) return;
      
      if (typeof content !== "number" || !isFinite(content)) return;
      
      index = content - 1;
    } else {
      class Line {
        constructor() {
          this.xCells = [];
          this.oCells = [];
          this.emptyCells = [];
        }
      }
      
      const rows = new Array(this.height).fill(undefined);
      const columns = new Array(this.width).fill(undefined);
      const diagonals = new Array(2).fill(undefined);
      
      for (let i = 0; i < rows.length; i++) {
        rows[i] = new Line();
      }
      
      for (let i = 0; i < columns.length; i++) {
        columns[i] = new Line();
      }
      
      for (let i = 0; i < diagonals.length; i++) {
        diagonals[i] = new Line();
      }
      
      const openCells = this.grid.map(
        function(element, index) {
          if (!element) {
            return index;
          }
        }
      ).filter((element) => element !== undefined);
      
      for (let cell of openCells) {
        let row = Math.floor(cell / this.width);
        let column = cell % this.width;
        
        for (let i = row * this.width; i < row * this.width + this.width; i++) {
          if (
            rows[row].xCells.length
            + rows[row].oCells.length
            + rows[row].emptyCells.length
            === this.width
          ) {
            break;
          }
          
          if (this.grid[i] === "X") {
            rows[row].xCells.push(i);
          } else if (this.grid[i] === "O") {
            rows[row].oCells.push(i);
          } else {
            rows[row].emptyCells.push(i);
          }
        }
        
        for (
          let i = column;
          i <= this.width * (this.height - 1) + column;
          i += this.width
        ) {
          if (
            columns[column].xCells.length
            + columns[column].oCells.length
            + columns[column].emptyCells.length
            === this.height
          ) {
            break;
          }
          
          if (this.grid[i] === "X") {
            columns[column].xCells.push(i);
          } else if (this.grid[i] === "O") {
            columns[column].oCells.push(i);
          } else {
            columns[column].emptyCells.push(i);
          }
        }
        
        for (let i = 0; i < this.grid.length; i += this.width + 1) {
          if (
            diagonals[0].xCells.length
            + diagonals[0].oCells.length
            + diagonals[0].emptyCells.length
            === this.height
          ) {
            break;
          }
          
          if (this.grid[i] === "X") {
            diagonals[0].xCells.push(i);
          } else if (this.grid[i] === "O") {
            diagonals[0].oCells.push(i);
          } else {
            diagonals[0].emptyCells.push(i);
          }
        }
        
        for (
          let i = this.width - 1;
          i <= this.grid.length - this.width;
          i += this.width - 1
        ) {
          if (
            diagonals[1].xCells.length
            + diagonals[1].oCells.length
            + diagonals[1].emptyCells.length
            === this.height
          ) {
            break;
          }
          
          if (this.grid[i] === "X") {
            diagonals[1].xCells.push(i);
          } else if (this.grid[i] === "O") {
            diagonals[1].oCells.push(i);
          } else {
            diagonals[1].emptyCells.push(i);
          }
        }
      }
      
      /* duplicate lines now detected during iteration
      for (let row of rows) {
        row.xCells = [...new Set(row.xCells)];
        row.oCells = [...new Set(row.oCells)];
        row.emptyCells = [...new Set(row.emptyCells)];
      }
      
      for (let column of columns) {
        column.xCells = [...new Set(column.xCells)];
        column.oCells = [...new Set(column.oCells)];
        column.emptyCells = [...new Set(column.emptyCells)];
      }
      
      for (let diagonal of diagonals) {
        diagonal.xCells = [...new Set(diagonal.xCells)];
        diagonal.oCells = [...new Set(diagonal.oCells)];
        diagonal.emptyCells = [...new Set(diagonal.emptyCells)];
      }
      */
      
      //for the win
      for (let row of rows) {
        if (index !== undefined) break;
        
        if (row.oCells.length === 2 && row.emptyCells.length === 1) {
          index = row.emptyCells[0];
          break;
        }
      }
      
      for (let column of columns) {
        if (index !== undefined) break;
        
        if (column.oCells.length === 2 && column.emptyCells.length === 1) {
          index = column.emptyCells[0];
          break;
        }
      }
      
      for (let diagonal of diagonals) {
        if (index !== undefined) break;
        
        if (diagonal.oCells.length === 2 && diagonal.emptyCells.length === 1) {
          index = diagonal.emptyCells[0];
          break;
        }
      }
      
      //for the block
      //imminent threats
      for (let row of rows) {
        if (index !== undefined) break;
        
        if (row.xCells.length === 2 && row.emptyCells.length === 1) {
          index = row.emptyCells[0];
          break;
        }
      }
      
      for (let column of columns) {
        if (index !== undefined) break;
        
        if (column.xCells.length === 2 && column.emptyCells.length === 1) {
          index = column.emptyCells[0];
          break;
        }
      }
      
      for (let diagonal of diagonals) {
        if (index !== undefined) break;
        
        if (diagonal.xCells.length === 2 && diagonal.emptyCells.length === 1) {
          index = diagonal.emptyCells[0];
          break;
        }
      }
      
      //developing threats
      if (index === undefined) {
        if (
          this.grid[4] === "X"
          && (
            !this.grid[0]
            || !this.grid[2]
            || !this.grid[6]
            || !this.grid[8]
          )
        ) {
          const openCorners = [0, 2, 6, 8].map(index => {
            if (!this.grid[index]) {
              return index;
            }
          }).filter(element => element !== undefined);
          
          index = openCorners[Math.floor(random() * openCorners.length)];
        }
      }
      
      //line up a win
      for (let row of rows) {
        if (index !== undefined) break;
        
        if (row.oCells.length === 1 && row.emptyCells.length === 2) {
          if (
            row.oCells[0] + 1 === row.emptyCells[0]
            || row.oCells[0] - 1 === row.emptyCells[0]
          ) {
            index = row.emptyCells[0];
          } else {
            index = row.emptyCells[1];
          }
          break;
        }
      }
      
      for (let column of columns) {
        if (index !== undefined) break;
        
        if (column.oCells.length === 1 && column.emptyCells.length === 2) {
          if (
            column.oCells[0] + this.width === column.emptyCells[0]
            || column.oCells[0] - this.width === column.emptyCells[0]
          ) {
            index = column.emptyCells[0];
          } else {
            index = column.emptyCells[1];
          }
          break;
        }
      }
      
      for (let diagonal of diagonals) {
        if (index !== undefined) break;
        
        if (diagonal.oCells.length === 1 && diagonal.emptyCells.length === 2) {
          if (
            diagonal.oCells[0] + (this.width + 1) === diagonal.emptyCells[0]
            || diagonal.oCells[0] - (this.width + 1) === diagonal.emptyCells[0]
          ) {
            index = diagonal.emptyCells[0];
          } else if (
            diagonal.oCells[0] + (this.width - 1) === diagonal.emptyCells[0]
            || diagonal.oCells[0] - (this.width - 1) === diagonal.emptyCells[0]
          ) {
            index = diagonal.emptyCells[0];
          } else {
            index = diagonal.emptyCells[1];
          }
          break;
        }
      }
      
      //something else
      if (index === undefined) {
        if (!this.grid[4]) {
          index = 4;
        } else {
          index = openCells[Math.floor(random() * openCells.length)];
        }
      }
      
      /*
      do {
        index = Math.floor(random() * this.grid.length);
      } while (this.grid[index]);
      */
    }
    
    this.clearGameTimeout();
    
    if (this.grid[index]) {
      return this.setGameTimeout();
    } else {
      this.grid[index] = this.turns % this.players.length === 0 ? "X" : "O";
      this.moves.push(index);
    }
    
    if (this.votesToKill.length > 0 && !this.isWon()) {
      line += this.getVoteToKillStatus(msg);
    }
    
    line += this.getGrid();
    
    if (this.isWon()) {
      line += 
        `${this.players[this.turns % this.players.length].username} wins!`
      ;
      
      await this.print(line);
      
      return this.endGame();
    } else {
      if (this.grid.every(arg => arg !== undefined)) {
        line += random() > 0.5 ? "Draw!" : "Cat's game!";
        
        await this.print(line);
        
        return this.endGame();
      }
      
      this.turns++;
      line +=
        `${this.players[this.turns % this.players.length].username} is up!`
      ;
      
      await this.print(line);
      
      this.setGameTimeout();
      
      if (this.singleplayer && (this.turns % this.players.length === 1)) {
        this.move();
      }
    }
  }
}

module.exports = TicTacToe;
