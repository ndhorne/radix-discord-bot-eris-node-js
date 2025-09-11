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

const { Constants } = require("eris");

//const { readFile } = require("node:fs/promises");

const Game = require("../game.js");

const isDM = require("../../helpers/isdm.js");
const random = require("../../helpers/random.js");
const getUser = require("../../helpers/getuser.js");
const getConcisePrefix = require("../../helpers/getconciseprefix.js");
const updateStatus = require("../../helpers/updatestatus.js");
const getHumanReadableTimeString =
  require("../../helpers/humanreadabletimestring.js")
;

const getHelp = require("../../commands/chat_input/help.js");

const { logMessage, logException } = require("../../helpers/loggers.js");

const bot = global.bot;
const games = global.states.games;
const data = global.data.notwordle;

class NotWordle extends Game {
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
    
    this.name = "Definitely Not Wordle";
    this.turnInProgress = false;
    this.updateInProgress = false;
    this.guesses = [];
    this.isChallenge = false;
    this.state = 0;
    this.startText;
    this.startTime;
    this.debug;
    
    this.players = [getUser(msg)];
    this.player = this.players[0];
    
    this.fiveLetterWordsCommon = data.fiveLetterWordsCommon;
    this.fiveLetterWords = data.fiveLetterWords;
    this.wordleWords = data.wordleWords;
    
    this.words = this.fiveLetterWordsCommon;
    this.word;
    
    this.useDictionaryAPI = false;
    
    this.winMessages = [
      "Congratulations!",
      "Success!",
      "You win!"
    ];
    
    this.loseMessages = [
      "Better luck next time!",
      "Bummer!"
    ];
    
    if (
      typeof args[0] === "string"
      && /^[a-zA-Z]{5}$/.test(args[0])
    ) {
      const challenge = args[0].toLowerCase();
      this.isChallenge = true;
      
      this.validateWord(challenge).then(result => {
        if (!result) {
          this.printWordNotFoundAndQuit(msg);
        } else {
          if (!isDM(msg)) {
            this.word = challenge.toUpperCase();
            
            this.print(
              `${this.player.username} has created a ${this.name} challenge!`
              + ` Type \`${getConcisePrefix(msg)}accept\` to accept!`
            );
            
            this.setGameTimeout();
          } else {
            this.print(`Cannot create a ${this.name} challenge in DM`);
            this.endGame();
          }
        }
      });
    } else if (
      args[0] === undefined
      || args[0] === null
    ) {
      setTimeout(() => {
        /*
        let firstLetter;
        
        do {
          firstLetter = String.fromCharCode(
            Math.floor(random() * (122 - 97 + 1)) + 97
          );
        } while (this.words[firstLetter].length === 0);
        */
        
        const words = this.words;
        
        this.word = words[Math.floor(random() * words.length)].toUpperCase();
        
        this.startText =
          `${this.player.username} has started a game of ${this.name}!\n`
          + this.getInstructions()
        ;
        
        this.startGame();
      }, 0);
      
      /* replaced with single shared words reference
      this.initWords().then(result => {
        this.word = result[Math.floor(random() * result.length)].toUpperCase();
        this.print(
          `${this.player.username} has started a game of ${this.name}!\n`
          + this.getInstructions()
        );
        this.startGame();
      });
      */
    } else {
      this.printHelpAndQuit(msg);
    }
  }
  
  /* replaced with single shared words reference
  async initWords() {
    try {
      const jsonWords = await readFile(`${__dirname}/words.json`, "utf8");
      const words = JSON.parse(jsonWords);
      
      this.words = words;
      
      return words;
    } catch (e) {
      logException(e);
    }
  }
  */
  
  async printHelpAndQuit(msg) {
    await this.print(
      await getHelp(msg, ["games", "play", "notwordle"])
    );
    
    setTimeout(() => this.endGame(), 0);
  }
  
  async printWordNotFoundAndQuit(msg) {
    await this.print("Challenge string is not a word (that I know of)!");
    
    setTimeout(() => this.endGame(), 0);
  }
  
  endGame() {
    this.clearGameTimeout(); //if any
    
    delete this.games[Symbol.for("gamesInProgress")][this.channel.id];
    delete this.games.notwordle[this.channel.id];
    
    updateStatus(this.games, this.bot);
  }
  
  getCurrentPlayer() {
    return this.player;
  }
  
  getInstructions() {
    return "Deduce the secret word using the color cues as your guide!\n"
      + "(Green: in word, in position; "
      + "Blue: in word, off position; "
      + "Red: not in word)"
    ;
  }
  
  startGame() {
    this.clearGameTimeout();
    
    this.started = true;
    this.startTime = Date.now();
    
    this.update();
    
    if (this.debug) console.log(this.word);
    
    this.setGameTimeout();
  }
  
  accept(msg) {
    const user = getUser(msg);
    
    if (!this.started) {
      this.player = this.players[0] = user;
      
      this.startText = `${this.player.username} accepts!\n`
        + this.getInstructions()
      ;
      
      this.startGame();
    }
  }
  
  getStyle(letter, index) {
    let style;
    
    if (
      Array.prototype.includes.call(this.word, letter)
      && this.word[index] === letter
    ) {
      style = "SUCCESS";
    } else if (
      Array.prototype.includes.call(this.word, letter)
    ) {
      style = "PRIMARY";
    } else {
      style = "DANGER";
    }
    
    return Constants.ButtonStyles[style];
  }
  
  getButton(letter, index) {
    return {
      type: Constants.ComponentTypes.BUTTON,
      style: this.getStyle(letter, index),
      custom_id: `notwordlebutton${this.guesses.length}${index}`,
      label: letter
    };
  }
  
  getRowComponents(guess) {
    let components = [];
    
    for (const [index, letter] of guess.split("").entries()) {
      components.push(this.getButton(letter, index));
    }
    
    return components;
  }
  
  getRow(guess) {
    return {
      type: Constants.ComponentTypes.ACTION_ROW,
      components: this.getRowComponents(guess)
    };
  }
  
  getRows() {
    const rows = [];
    
    for (const guess of this.guesses) {
      rows.push(this.getRow(guess));
    }
    
    if (this.guesses.length < 6) {
      for (let i = 0; i < 6 - this.guesses.length; i++) {
        rows.push(
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: ((i) => {
              const components = [];
              
              for (let j = 0; j < 5; j++) {
                components.push(
                  {
                    type: Constants.ComponentTypes.BUTTON,
                    style: Constants.ButtonStyles.SECONDARY,
                    custom_id: `notwordlebutton${this.guesses.length + i}${j}`,
                    label: "·"
                  }
                );
              }
              
              return components;
            })(i)
          }
        );
      }
    }
    
    return rows;
  }
  
  async update() {
    this.updateInProgress = true;
    
    const rows = this.getRows();
    
    for (const [index, row] of rows.entries()) {      
      await this.print(
        {
          content: (
            (index === 0 && this.guesses.length === 0 && this.state === 0)
            || (index === 0 && this.state === 1)
            ? this.startText
            : undefined
          ),
          components: [ row ]
        }
      );
    }
    
    this.updateInProgress = false;
  }
  
  async isInDictionaryAPI(word) {
    if (this.useDictionaryAPI) {
      const uri = "https://api.dictionaryapi.dev/api/v2/entries/en/" + word;
      
      try {
        const response = await fetch(uri);
        
        try {
          const result = await response.json();
          
          if (result.title === "No Definitions Found") {
            return false;
          } else {
            return true;
          }
        } catch (err) {
          logMessage(`Unexpected response from ${uri}`);
          logException(err);
        }
      } catch (err) {
        this.useDictionaryAPI = false;
        
        logMessage(`Error connecting to ${uri}`);
        logException(err);
      }
    }
  }
  
  isInList(word) {
    //word = word.toLowerCase();
    
    return (
      this.fiveLetterWordsCommon.includes(word)
      || this.fiveLetterWords.includes(word)
      || this.wordleWords.includes(word)
    );
  }
  
  async validateWord(word) {
    if (
      !await this.isInDictionaryAPI(word)
      && !this.isInList(word)
    ) {
      return false;
    }
    
    return true;
  }
  
  async turn(msg, content) {
    if (!this.started || this.turnInProgress || this.updateInProgress) return;
    
    this.clearGameTimeout();
    
    this.turnInProgress = true;
    
    //let content = msg.content.trim();
    
    if (this.guesses.includes(content.toUpperCase())) {
      await this.print(`"${content}" already guessed!`);
      
      this.turnInProgress = false;
      return this.setGameTimeout();
    }
    
    if (content === "xyzzy" || content === "plugh") {
      await this.print("Nothing happens.");
      
      this.turnInProgress = false;
      return this.setGameTimeout();
    }
    
    if (!await this.validateWord(content)) {
      await this.print(`"${content}" is not a word (that I know of)!`);
      
      this.turnInProgress = false;
      return this.setGameTimeout();
    }
    
    content = content.toUpperCase();
    
    this.guesses.push(content);
    
    if (content === this.word) {
      this.state = 1;
      
      if (this.guesses.length === 1) {
        this.startText = "Black magic!";
      } else {
        this.startText = this.winMessages[
          Math.floor(random() * this.winMessages.length)
        ];
      }
      
      this.startText +=
        ` Secret word ${this.word} deduced in ${this.guesses.length} guess`
        + (this.guesses.length > 1 ? "es" : "")
        + " (over "
        + getHumanReadableTimeString((Date.now() - this.startTime) / 1000)
        + ")!"
      ;
    }
    
    if (this.guesses.length === 6 && content !== this.word) {
      const unguessed = this.word.split("").filter((letter, index) => {
        return this.guesses[5][index] !== letter;
      });
      
      this.state = 1;
      
      if (unguessed.length > 1) {
        this.startText = this.loseMessages[
          Math.floor(random() * this.loseMessages.length)
        ];
      } else {
        this.startText = "So close!";
      }
      
      this.startText += ` Reveal word: ||${this.word}||`;
    }
    
    await this.update();
    
    if (this.state === 1) return this.endGame();
    
    this.turnInProgress = false;
    
    if (this.guesses.length < 6 && content !== this.word) this.setGameTimeout();
  }
}

module.exports = NotWordle;
