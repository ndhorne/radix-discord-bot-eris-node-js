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

class Connect4 extends Game {
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
    
    this.name = "Connect 4";
    this.turns = 0;
    this.width = 7;
    this.height = 6;
    this.grid = new Array(this.width * this.height).fill(undefined);
    this.players = new Array(2).fill(undefined);
    this.moves = [];
    this.debug = false;
    
    this.players[0] = getUser(msg);
    
    if (+args[0] === 1) {
      setTimeout(() => {
        this.singleplayer = true;
        this.players[1] = this.bot.user;
        this.print(
          `${this.players[0].username} has started a game of ${this.name}!`
        );
        this.onJoin(msg);
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
      await getHelp(msg, ["games", "play", "connect4"])
    );
    setTimeout(() => {
      this.endGame();
    }, 0);
  }
  
  async endGame() {
    this.clearGameTimeout(); //if any
    
    delete this.games[Symbol.for("gamesInProgress")][this.channel.id];
    delete this.games.connect4[this.channel.id];
    
    updateStatus(this.games, this.bot);
  }
  
  getCurrentPlayer() {
    return this.players[this.turns % this.players.length];
  }
  
  getGrid() {
    let str = "``` 1  2  3  4  5  6  7 \n";
    
    this.grid.forEach((value, index) => {
      if (index !== 0 && index % (this.width) === 0) {
        str += "\n";
      }
      str += ` ${value ? value : "."} `;
    });
    
    str += "```";
    
    return str;
  }
  
  async onJoin(msg) {
    let line = `${this.players[1].username} joins!\n`;
    line += "Line up four in a row in any direction!";
    line += this.getGrid();
    line += `${this.players[this.turns % this.players.length].username} is up!`;
    
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
      this.onJoin(msg);
      
      return this.setGameTimeout();
    }
  }
  
  isColumnFull(col) {
    const index = col - 1;
    
    if (this.grid[index] !== undefined) return true;
    
    return false;
  }
  
  //undefined return value denotes full column
  getNextEmptyCell(col) {
    let index = col - 1;
    
    if (this.isColumnFull(col)) return;
    
    while (
      index + this.width < this.grid.length
      && this.grid[index + this.width] === undefined
    ) {
      index += this.width;
    }
    
    return index;
  }
  
  //undefined return value denotes empty column
  getTopColumnValue(col) {
    let index = col - 1;
    
    while (
      index + this.width < this.grid.length
      && this.grid[index] === undefined
    ) {
      index += this.width;
    }
    
    return this.grid[index];
  }
  
  getColumnIndices(col) {
    let index = col - 1;
    const indices = [];
    
    do {
      indices.push(index);
      index += this.width;
    } while (index < this.grid.length);
    
    return indices;
  }
  
  getRowStart(index) {
    let start = index;
    
    const isThreshold = pos => pos % this.width === 0;
    
    if (isThreshold(start)) return start;
    
    while (
      this.grid[start - 1] === this.grid[index]
    ) {
      start = start - 1;
      if (isThreshold(start)) break;
    }
    
    return start;
  }
  
  getColumnStart(index) {
    let start = index;
    
    const isThreshold = pos => pos - this.width < 0;
    
    if (isThreshold(start)) return start;
    
    while (
      this.grid[start - this.width] === this.grid[index]
    ) {
      start = start - this.width;
      if (isThreshold(start)) break;
    }
    
    return start;
  }
  
  getDiagonalUpLeftStart(index) {
    let start = index;
    
    const isThreshold = pos => {
      return (
        pos - (this.width + 1) < 0
        || (
          Math.floor((pos - (this.width + 1)) / this.width)
          < Math.floor((pos - this.width) / this.width)
        )
      );
    };
    
    if (isThreshold(start)) return start;
    
    while (
      this.grid[start - (this.width + 1)] === this.grid[index]
      && (
        Math.floor((start - (this.width + 1)) / this.width)
        === Math.floor((start - this.width) / this.width)
      )
    ) {
      start = start - (this.width + 1);
      if (isThreshold(start)) break;
    }
    
    return start;
  }
  
  getDiagonalUpRightStart(index) {
    let start = index;
    
    const isThreshold = pos => {
      return (
        pos - (this.width - 1) < 0
        || (
          Math.floor((pos - (this.width - 1)) / this.width)
          === Math.floor(pos / this.width)
        )
      );
    };
    
    if (isThreshold(start)) return start;
    
    while (
      this.grid[start - (this.width - 1)] === this.grid[index]
      && (
        Math.floor((start - (this.width - 1)) / this.width)
        !== Math.floor(start / this.width)
      )
    ) {
      start = start - (this.width - 1);
      if (isThreshold(start)) break;
    }
    
    return start;
  }
  
  isWon(index) {
    let pos;
    
    pos = this.getRowStart(index);
    
    if (pos % this.width <= 3) {
      for (let i = 0; i < 4; i++) {
        if (this.grid[pos] !== this.grid[index]) break;
        if (i === 3) return true;
        pos++;
      }
    }
    
    pos = this.getColumnStart(index);
    
    if (Math.floor(pos / this.width) <= 2) {
      for (let i = 0; i < 4; i++) {
        if (this.grid[pos] !== this.grid[index]) break;
        if (i === 3) return true;
        pos += this.width;
      }
    }
    
    pos = this.getDiagonalUpLeftStart(index);
    
    if (pos % this.width <= 3 && Math.floor(pos / this.width) <= 2) {
      for (let i = 0; i < 4; i++) {
        if (this.grid[pos] !== this.grid[index]) break;
        if (i === 3) return true;
        pos += this.width + 1;
      }
    }
    
    pos = this.getDiagonalUpRightStart(index);
    
    if (pos % this.width >= 3 && Math.floor(pos / this.width) <= 2) {
      for (let i = 0; i < 4; i++) {
        if (this.grid[pos] !== this.grid[index]) break;
        if (i === 3) return true;
        pos += this.width - 1;
      }
    }
    
    return false;
  }
  
  getSequencesDiagonalUpRight(index) {
    let start, threshold;
    
    const sequences = [];
    
    const exceedsGrid = index => index < 0 || index >= this.grid.length;
    
    const nextCellUpExceedsBorder = index => {
      return (
        Math.floor(index / this.width)
        === Math.floor((index - (this.width - 1)) / this.width)
      );
    };
    
    const nextCellDownExceedsBorder = index => {
      return (
        Math.floor(index / this.width)
        === Math.floor((index + (this.width - 1)) / this.width)
      );
    };
    
    const sequenceExceedsBorder = index => {
      const positions = [index];
      
      for (let i = 1; i < 4; i++) {
        positions.push(index - ((this.width - 1) * i));
      }
      
      return (
        positions.some((pos, idx) => {
          return (
            pos < 0
            || (
              idx > 0
              && (
                Math.floor(pos / this.width)
                === Math.floor((pos + (this.width - 1)) / this.width)
              )
            )
          );
        })
      );
    };
    
    start = index;
    
    while (
      sequenceExceedsBorder(start)
      && start < index + ((this.width - 1) * 3)
      && !nextCellDownExceedsBorder(start)
      && !exceedsGrid(start + (this.width - 1))
    ) {
      start += this.width - 1;
    }
    
    if (
      (
        start % this.width > 3
        && Math.floor(start / this.width) === 5
      )
      || (
        start % this.width === 0
        && Math.floor(start / this.width) < 3
      )
    ) return [];
    
    threshold = start;
    
    while (
      Math.floor(threshold / this.width) < 5
      && threshold < index + ((this.width - 1) * 3)
      && !nextCellDownExceedsBorder(threshold)
      && !exceedsGrid(threshold + (this.width - 1))
    ) {
      threshold += this.width - 1;
    }
    
    for (let i = start; i <= threshold; i += this.width - 1) {
      let indexes = [];
      
      for (let j = 0; j < 4; j++) {
        indexes[j] = i - ((this.width - 1) * j);
      }
      
      //if (indexes.some(exceedsGrid)) continue;
      
      sequences.push(indexes);
    }
    
    if (this.debug) {
      console.log("DiagonalUpRight:");
      console.log(`index: ${index}`);
      console.log(`start: ${start}`);
      console.log(`threshold: ${threshold}`);
      console.log("sequences:", sequences);
    }
    
    return sequences;
  }
  
  getSequencesHorizontal(index) {
    let start, threshold;
    
    const sequences = [];
    
    const exceedsGrid = index => index < 0 || index >= this.grid.length;
    
    start = index;
    
    while (start % this.width > 3) start--;
    
    threshold = start;
    
    while (
      threshold % this.width > 0
      && threshold > index - 3
    ) {
      threshold--;
    }
    
    for (let i = start; i >= threshold; i--) {
      let indexes = [];
      
      for (let j = 0; j < 4; j++) {
        indexes[j] = i + j;
      }
      
      //if (indexes.some(exceedsGrid)) continue;
      
      sequences.push(indexes);
    }
    
    if (this.debug) {
      console.log("Horizontal:");
      console.log(`index: ${index}`);
      console.log(`start: ${start}`);
      console.log(`threshold: ${threshold}`);
      console.log("sequences:", sequences);
    }
    
    return sequences;
  }
  
  getSequencesDiagonalDownRight(index) {
    let start, threshold;
    
    const sequences = [];
    
    const exceedsGrid = index => index < 0 || index >= this.grid.length;
    
    const nextCellUpExceedsBorder = index => {
      return (
        Math.floor(index / this.width) - 1
        !== Math.floor((index - (this.width + 1)) / this.width)
      );
    };
    
    const nextCellDownExceedsBorder = index => {
      return (
        Math.floor(index / this.width) + 1
        !== Math.floor((index + (this.width + 1)) / this.width)
      );
    };
    
    const sequenceExceedsBorder = index => {
      const positions = [index];
      
      for (let i = 1; i < 4; i++) {
        positions.push(index - ((this.width + 1) * i));
      }
      
      return (
        positions.some((pos, idx) => {
          return (
            pos < 0
            || (
              idx > 0
              && (
                Math.floor(pos / this.width) + 1
                !== Math.floor((pos + (this.width + 1)) / this.width)
              )
            )
          );
        })
      );
    };
    
    start = index;
    
    while (
      sequenceExceedsBorder(start)
      && start < index + ((this.width + 1) * 3)
      && !nextCellDownExceedsBorder(start)
      && !exceedsGrid(start + (this.width + 1))
    ) {
      start += this.width + 1;
    }
    
    if (
      (
        start % this.width > 3
        && Math.floor(start / this.width) < 3
      )
      || (
        start % this.width < 3
        && Math.floor(start / this.width) === 5
      )
    ) return [];
    
    threshold = start;
    
    while (
      Math.floor(threshold / this.width) < 5
      && threshold < index + ((this.width + 1) * 3)
      && !nextCellDownExceedsBorder(threshold)
      && !exceedsGrid(threshold + (this.width + 1))
    ) {
      threshold += this.width + 1;
    }
    
    for (let i = start; i <= threshold; i += this.width + 1) {
      let indexes = [];
      
      for (let j = 0; j < 4; j++) {
        indexes[j] = i - ((this.width + 1) * j);
      }
      
      //if (indexes.some(exceedsGrid)) continue;
      
      sequences.push(indexes);
    }
    
    if (this.debug) {
      console.log("DiagonalDownRight:");
      console.log(`index: ${index}`);
      console.log(`start: ${start}`);
      console.log(`threshold: ${threshold}`);
      console.log("sequences:", sequences);
    }
    
    return sequences;
  }
  
  getSequencesDown(index) {
    let start, threshold;
    
    const sequences = [];
    
    const exceedsGrid = index => index < 0 || index >= this.grid.length;
    
    start = index;
    
    if (Math.floor(start / this.width) > 2) return [];
    
    threshold = start;
    
    for (let i = start; i >= threshold; i -= this.width) {
      let indexes = [];
      
      for (let j = 0; j < 4; j++) {
        indexes[j] = i + (this.width * j);
      }
      
      //if (indexes.some(exceedsGrid)) continue;
      
      sequences.push(indexes);
    }
    
    if (this.debug) {
      console.log("Down:");
      console.log(`index: ${index}`);
      console.log(`start: ${start}`);
      console.log(`threshold: ${threshold}`);
      console.log("sequences:", sequences);
    }
    
    return sequences;
  }
  
  findLine(col, marker, methods, offset = 0) {
    if (offset < 0) offset = 0;
    
    const target = this.getNextEmptyCell(col) - (offset * this.width);
    
    const filterTarget = index => index !== target;
    
    for (const method of methods) {
      const sequences = method.call(this, target);
      
      for (let sequence of sequences) {
        sequence = sequence.filter(filterTarget);
        
        if (sequence.every(index => this.grid[index] === marker)) {
          return col;
        }
      }
    }
  }
  
  findLineDiagonalUpRight(col, marker, offset) {
    return this.findLine(
      col, marker, [this.getSequencesDiagonalUpRight], offset
    );
  }
  
  findLineHorizontal(col, marker, offset) {
    return this.findLine(
      col, marker, [this.getSequencesHorizontal], offset
    );
  }
  
  findLineDiagonalDownRight(col, marker, offset) {
    return this.findLine(
      col, marker, [this.getSequencesDiagonalDownRight], offset
    );
  }
  
  findLineDown(col, marker, offset) {
    return this.findLine(
      col, marker, [this.getSequencesDown], offset
    );
  }
  
  findPartial(col, marker, methods, min, offset = 0) {
    if (offset < 0) offset = 0;
    
    const target = this.getNextEmptyCell(col) - (offset * this.width);
    
    for (const method of methods) {
      const sequences = method.call(this, target);
      
      for (let sequence of sequences) {
        sequence = sequence.filter(index => this.grid[index] !== undefined);
        
        if (
          sequence.every(index => this.grid[index] === marker)
          && sequence.length === min
        ) {
          return col;
        }
      }
    }
  }
  
  getColumnPartialCount(col, marker, methods, min) {
    const target = this.getNextEmptyCell(col);
    
    let count = 0;
    
    for (const method of methods) {
      const sequences = method.call(this, target);
      
      for (let sequence of sequences) {
        sequence = sequence.filter(index => this.grid[index] !== undefined);
        
        if (
          sequence.every(index => this.grid[index] === marker)
          && sequence.length >= min
        ) {
          count++;
          break;
        }
      }
    }
    
    return count;
  }
  
  getTargetPartialCount(col, marker, methods, min) {
    const target = this.getNextEmptyCell(col);
    
    let count = 0;
    
    cols: for (let c = 1; c <= 7; c++) {
      const index = this.getNextEmptyCell(c);
      
      for (const method of methods) {
        const sequences = method.call(this, index);
        
        for (const sequence of sequences) {
          let s = sequence.filter(index => this.grid[index] !== undefined);
          
          if (
            s.every(index => this.grid[index] === marker)
            && s.length >= min
            && sequence.includes(target)
          ) {
            count++;
            continue cols;
          }
        }
      }
    }
    
    return count;
  }
  
  getMarker(turns) {
    turns = turns || this.turns;
    
    return turns % this.players.length === 0 ? "X" : "O";
  }
  
  enablesOpponentWin(col) {
    return !!this.findLine(
      col,
      "X",
      [
        this.getSequencesDiagonalUpRight,
        this.getSequencesHorizontal,
        this.getSequencesDiagonalDownRight
      ],
      1 //ascending vertical offset
    );
  }
  
  enablesOpponentBlock(col) {
    return !!this.findLine(
      col,
      "O",
      [
        this.getSequencesDiagonalUpRight,
        this.getSequencesHorizontal,
        this.getSequencesDiagonalDownRight
      ],
      1 //ascending vertical offset
    );
  }
  
  async move(msg, content) {
    const user = msg ? getUser(msg) : this.bot;
    
    let column, index, columns = [], moveType, line = "";    
    
    //stops player from taking additional turns before this.turns is incremented
    if (
      this.moves.length > 0
      && (
        this.getTopColumnValue(this.moves[this.moves.length - 1])
        === this.getMarker()
      )
    ) return;
    
    if (
      !this.singleplayer
      || (this.singleplayer && (this.turns % this.players.length === 0))
    ) {
      if (
        user.id !== this.players[this.turns % this.players.length].id
      ) return;
      
      moveType = "player";
      
      column = +content;
      
      if (!isFinite(column)) return;
      
      if (column < 1 || column > 7) return;
      
      if (this.isColumnFull(column)) return;
    } else {
      //for the win
      for (let col = 1; col <= 7; col++) {
        if (this.isColumnFull(col)) continue;
        
        moveType = "win";
        
        if (this.debug) {
          console.log(`col: ${col}`);
          console.log(`processing: ${moveType}`);
        }
        
        const c = this.findLine(
          col,
          "O",
          [
            this.getSequencesDiagonalUpRight,
            this.getSequencesHorizontal,
            this.getSequencesDiagonalDownRight,
            this.getSequencesDown
          ]
        );
        
        if (c) columns.push(c);
      }
      
      if (columns.length > 0) {
        column = columns[Math.floor(random() * columns.length)];
      }
      
      //for the block
      //imminent threats
      for (let col = 1; col <= 7; col++) {
        if (column) break;
        
        if (this.isColumnFull(col)) continue;
        
        //if (this.enablesOpponentWin(col)) continue;
        
        moveType = "imminent threat";
        
        if (this.debug) {
          console.log(`col: ${col}`);
          console.log(`processing: ${moveType}`);
        }
        
        const c = this.findLine(
          col,
          "X",
          [
            this.getSequencesDiagonalUpRight,
            this.getSequencesHorizontal,
            this.getSequencesDiagonalDownRight,
            this.getSequencesDown
          ]
        );
        
        if (c) columns.push(c);
      }
      
      if (columns.length > 0) {
        column = columns[Math.floor(random() * columns.length)];
      }
      
      //developing threats
      for (let col = 1; col <= 7; col++) {
        if (column) break;
        
        if (this.isColumnFull(col)) continue;
        
        const target = this.getNextEmptyCell(col);
        
        //horizontal
        moveType = "developing threat (horizontal)";
        
        if (col === 1 || col === 2 || col === 3 || col === 4) {
          if (
            (
              this.grid[target + 1] === "X"
              && this.grid[target + 2] === "X"
              && (
                this.grid[target + 3] !== "O"
                && (
                  Math.floor(target / this.width) === 5
                  || this.grid[(target + 3) + this.width] !== undefined
                )
              )
            )
            && (!this.enablesOpponentWin(col))
          ) {
            columns.push(col);
          }
        }
        
        if (col === 4 || col === 5 || col === 6 || col === 7) {
          if (
            (
              this.grid[target - 1] === "X"
              && this.grid[target - 2] === "X"
              && (
                this.grid[target - 3] !== "O"
                && (
                  Math.floor(target / this.width) === 5
                  || this.grid[(target - 3) + this.width] !== undefined
                )
              )
            )
            && (!this.enablesOpponentWin(col))
          ) {
            columns.push(col);
          }
        }
        
        //diagonal
        moveType = "developing threat (diagonal)";
        
        if (target % this.width <= 3) {
          if (Math.floor(target / this.width) < 3) {
            if (
              (
                this.grid[target + (this.width + 1)] === "X"
                && this.grid[target + ((this.width + 1) * 2)] === "X"
                && (
                  this.grid[target + ((this.width + 1) * 3)] !== "O"
                  && (
                    Math.floor((target + ((this.width + 1) * 3)) / this.width)
                    === 5
                    || (
                      this.grid[(target + ((this.width + 1) * 3)) + this.width]
                      !== undefined
                    )
                  )
                )
              )
              && (!this.enablesOpponentWin(col))
            ) {
              columns.push(col);
            }
          } else if (Math.floor(target / this.width) > 2) {
            if (
              (
                this.grid[target - (this.width - 1)] === "X"
                && this.grid[target - ((this.width - 1) * 2)] === "X"
                && (
                  this.grid[target - ((this.width - 1) * 3)] !== "O"
                  && (
                    this.grid[(target - ((this.width - 1) * 3)) + this.width]
                    !== undefined
                  )
                )
              )
              && (!this.enablesOpponentWin(col))
            ) {
              columns.push(col);
            }
          }
        }
        
        if (target % this.width >= 3) {
          if (Math.floor(target / this.width) < 3) {
            if (
              (
                this.grid[target + (this.width - 1)] === "X"
                && this.grid[target + ((this.width - 1) * 2)] === "X"
                && (
                  this.grid[target + ((this.width - 1) * 3)] !== "O"
                  && (
                    Math.floor((target + ((this.width - 1) * 3)) / this.width)
                    === 5
                    || (
                      this.grid[(target + ((this.width - 1) * 3)) + this.width]
                      !== undefined
                    )
                  )
                )
              )
              && (!this.enablesOpponentWin(col))
            ) {
              columns.push(col);
            }
          } else if (Math.floor(target / this.width) > 2) {
            if (
              (
                this.grid[target - (this.width + 1)] === "X"
                && this.grid[target - ((this.width + 1) * 2)] === "X"
                && (
                  this.grid[target - ((this.width + 1) * 3)] !== "O"
                  && (
                    this.grid[(target - ((this.width + 1) * 3)) + this.width]
                    !== undefined
                  )
                )
              )
              && (!this.enablesOpponentWin(col))
            ) {
              columns.push(col);
            }
          }
        }
      } //end for (let col = 1; col <= 7; col++)
      
      if (columns.length > 0) {
        column = columns[Math.floor(random() * columns.length)];
      }
      
      //line up a win
      //control the center
      if (!this.isColumnFull(4) && !column) {
        moveType = "control the center";
        column = 4;
      }
      
      //build on a sequence
      for (let i = 2; i >= 1; i--) {
        if (column) break;
        
        moveType = `build on a sequence (minimum: ${i})`;
        
        for (let col = 1; col <= 7; col++) {
          if (this.isColumnFull(col)) continue;
          
          if (
            this.enablesOpponentWin(col)
            || this.enablesOpponentBlock(col)
          ) continue;
          
          if (this.debug) {
            console.log(`col: ${col}`);
            console.log(`processing: ${moveType}`);
          }
          
          const c = this.findPartial(
            col,
            "O",
            [
              this.getSequencesDiagonalUpRight,
              this.getSequencesHorizontal,
              this.getSequencesDiagonalDownRight,
              this.getSequencesDown
            ],
            i //minimum number of occurrences
          );
          
          if (c) columns.push(c);
        }
        
        if (columns.length > 0) {
          const maxPartials = columns.reduce((max, col) => {
            const count = this.getColumnPartialCount(
              col,
              "O",
              [
                this.getSequencesDiagonalUpRight,
                this.getSequencesHorizontal,
                this.getSequencesDiagonalDownRight,
                this.getSequencesDown
              ],
              i //minimum number of occurrences
            );
            
            return count > max ? count : max;
          }, 0);
          
          columns = columns.filter(col => {
            return this.getColumnPartialCount(
              col,
              "O",
              [
                this.getSequencesDiagonalUpRight,
                this.getSequencesHorizontal,
                this.getSequencesDiagonalDownRight,
                this.getSequencesDown
              ],
              i //minimum number of occurrences
            ) === maxPartials;
          });
          
          column = columns[Math.floor(random() * columns.length)];
        }
      }
      
      //random move
      if (!column) {
        moveType = "random";
        
        const randColumns = [], opponentWinCols = [], opponentBlockCols = [];
        
        function getRandomColumn() {
          return Math.floor(random() * 7) + 1;
        }
        
        do {
          column = getRandomColumn();
          
          if (!randColumns.includes(column)) randColumns.push(column);
          
          if (
            this.enablesOpponentWin(column)
            && !opponentWinCols.includes(column)
          ) {
            opponentWinCols.push(column);
          }
          
          if (
            this.enablesOpponentBlock(column)
            && !opponentBlockCols.includes(column)
          ) {
            opponentBlockCols.push(column);
          }
        } while (
          this.isColumnFull(column)
          || (
            randColumns.length < 7
            && (
              this.enablesOpponentWin(column)
              || this.enablesOpponentBlock(column)
            )
          )
        );
        
        if (
          this.enablesOpponentWin(column)
          && opponentBlockCols.length > 0
          //&& opponentWinCols.length > 0
        ) {
          if (
            !opponentBlockCols.every(col => opponentWinCols.includes(col))
          ) {
            do {
              column = opponentBlockCols[
                Math.floor(random() * opponentBlockCols.length)
              ];
            } while (opponentWinCols.includes(column));
          }
        }
      }
    }
    
    this.clearGameTimeout();
    
    index = this.getNextEmptyCell(column);
    this.grid[index] = this.getMarker();
    this.moves.push(column);
    
    if (this.debug) {
      console.log(`turn: ${this.moves.length}`);
      console.log(`marker: ${this.getMarker()}`);
      console.log(`column: ${column}`);
      console.log(`row: ${Math.floor(index / this.width)}`);
      console.log(`cell: ${index}`);
      console.log(`move: ${moveType}`);
    }
    
    if (this.votesToKill.length > 0 && !this.isWon(index)) {
      line += this.getVoteToKillStatus(msg);
    }
    
    line += this.getGrid();
    
    if (this.isWon(index)) {
      line +=
        `${this.players[this.turns % this.players.length].username} wins!`
      ;
      
      this.print(line);
      
      return this.endGame();
    } else {
      if (this.grid.every(arg => arg !== undefined)) {
        line += "Draw!";
        
        this.print(line);
        
        return this.endGame();
      }
      
      this.turns++;
      
      line +=
        `${this.players[this.turns % this.players.length].username} is up!`
      ;
      
      this.print(line);
      
      this.setGameTimeout();
      
      if (this.singleplayer && (this.turns % this.players.length === 1)) {
        this.move();
      }
    }
  }
}

module.exports = Connect4;
