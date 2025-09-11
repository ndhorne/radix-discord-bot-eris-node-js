/*
Copyright (C) 2022, 2023, 2024, 2025 Nicholas D. Horne

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

const admins = global.admins;

const getUser = require("../../helpers/getuser.js");

async function getHelp(msg, args) {
  const user = getUser(msg);
  const mostConcisePrefix = require("../../helpers/getconciseprefix.js")(msg);
  
  switch(args[0]) {
    case "admin":
      if (admins.includes(user.id)) {
        switch(args[1]) {
          case "logs":
            return "usage: "
              + mostConcisePrefix
              + "admin logs "
              + "{errors | warnings | messages | exceptions} "
              + "[head | tail [n]]\n"
              + "Query logs"
            ;
          default:
            return "usage: "
              + mostConcisePrefix
              + "admin "
              + "{logs}\n"
              + "Admin tools"
            ;
          //end cases
        }
      } else return await getHelp(msg);
    case "query":
      switch(args[1]) {
        case "8ball":
          return "usage: "
            + mostConcisePrefix
            + "query 8ball <question>\n"
            + "Ask the magic 8 ball"
          ;
        case "currency":
          return "usage: "
            + mostConcisePrefix
            + "query currency <symbol> [<symbol>]\n"
            + "Currency converter\n"
            + "e.g., "
            + mostConcisePrefix
            + "query currency btc usd"
          ;
        case "fortune":
          return "usage: "
            + mostConcisePrefix 
            + "query fortune\n"
            + "Fortune cookie"
          ;
        case "gallery":
          switch(args[2]) {
            case "angryflower":
              return "usage: "
                + mostConcisePrefix
                + "query gallery angryflower [<#>]\n"
                + "Query Bob the Angry Flower"
              ;
            case "met":
              return "usage: "
                + mostConcisePrefix
                + "query gallery met [<Met Object ID>]\n"
                + "Query Met Collection"
              ;
            case "pokey":
              return "usage: "
                + mostConcisePrefix
                + "query gallery pokey [<#>]\n"
                + "Query Pokey the Penguin archives"
              ;
            case "xkcd":
              return "usage: "
                + mostConcisePrefix
                + "query gallery xkcd [<xkcd #>]\n"
                + "Query xkcd"
              ;
            default:
              return "usage: "
                + mostConcisePrefix
                + "query gallery "
                + "{met | angryflower | pokey | xkcd}\n"
                + "Query a gallery"
              ;
            //end cases
          }
        case "horoscope":
          return "usage: "
            + mostConcisePrefix
            + "query horoscope "
            + "{aries | taurus | gemini | cancer | leo | virgo | libra | "
            + "scorpio | sagittarius | capricorn | aquarius | pisces}\n"
            + "What do the stars have in store for you?"
          ;
        /*
        case "logs":
          if (!admins.includes(user.id)) {
            return await getHelp(msg, ["query"]);
          } else {
            return "usage: "
              + mostConcisePrefix
              + "query logs "
              + "{errors | warnings | messages | exceptions} "
              + "[head | tail [n]]\n"
              + "Query logs"
            ;
          }
        */
        default:
          return "usage: "
            + mostConcisePrefix
            + "query "
            + "{8ball | fortune | currency | gallery | horoscope}\n"
            //+ (admins.includes(user.id) ? " | logs" : "") + "}\n"
            + "Query a resource"
          ;
        //end cases
      }
    case "games":
      switch(args[1]) {
        case "play":
          switch(args[2]) {
            case "connect4":
              return "usage: "
                + mostConcisePrefix
                + "games play connect4 "
                + "[<number of players>]\n"
                + "Play Connect 4"
              ;
            case "hangman":
              return "usage: "
                + mostConcisePrefix
                + "games play hangman "
                + "[<challenge string>] | "
                + "[<min number of letters> [<max number of letters>]]\n"
                + "Play Hangman"
              ;
            case "matchstick":
              return "usage: "
                + mostConcisePrefix
                + "games play matchstick "
                + "[<number of players> [<number of matchsticks]]\n"
                + "Play Matchstick Game"
              ;
            case "notwordle":
              return "usage: "
                + mostConcisePrefix
                + "games play notwordle "
                + "[<5 letter challenge string>]\n"
                + "Play Definitely Not Wordle"
              ;
            case "randomactsofascii":
              return "usage: "
                + mostConcisePrefix
                + "games play randomactsofascii "
                + "[<number of expressions> [<singleplayer boolean>]]\n"
                + "Play Random Acts of ASCII"
              ;
            case "tictactoe":
              return "usage: "
                + mostConcisePrefix
                + "games play tictactoe "
                + "[<number of players>]\n"
                + "Play Tic Tac Toe"
              ;
            default:
              return "usage: "
                + mostConcisePrefix
                + "games play "
                + "{connect4 | hangman | matchstick | notwordle | "
                + "randomactsofascii | tictactoe}\n"
                + "Shall we play a game?"
              ;
            //end cases
          }
        case "join":
          return "usage: "
            + mostConcisePrefix
            + "games join\n"
            + "Join a game waiting for players"
          ;
        case "hint":
          return "usage: "
            + mostConcisePrefix
            + "games hint\n"
            + "Request a hint"
          ;
        case "accept":
          return "usage: "
            + mostConcisePrefix
            + "games accept\n"
            + "Accept a challenge"
          ;
        case "start":
          return "usage: "
            + mostConcisePrefix
            + "games start\n"
            + "Start a game waiting for players (game initiator only)"
          ;
        case "concede":
          return "usage: "
            + mostConcisePrefix
            + "games concede\n"
            + "Concede a game in progress"
          ;
        case "gameover":
          return "usage: "
            + mostConcisePrefix
            + "games gameover "
            + "[<game id>] ...\n"
            + "Prematurely terminate a game in progress"
          ;
        case "nowplaying":
          return "usage: "
            + mostConcisePrefix
            + "games nowplaying\n"
            + "List games in progress"
          ;
        default:
          return "usage: "
            + mostConcisePrefix
            + "games "
            + "{play | join | hint | accept | start | concede | gameover | "
            + "nowplaying}\n"
            + "Play a game with another user"
          ;
        //end cases
      }
    case "utils":
      switch(args[1]) {
        case "randpass":
          return "usage: "
            + mostConcisePrefix
            + "utils randpass "
            + "[length]\n"
            + "Generate a random password"
          ;
        case "rot13":
          return "usage: "
            + mostConcisePrefix
            + "utils rot13 "
            + "<string>\n"
            + "Encode a string to ROT13"
          ;
        default:
          return "usage: "
            + mostConcisePrefix
            + "utils "
            + "{randpass | rot13}\n"
            + "Utilities of varying usefulness"
          ;
        //end cases
      }
    case "info":
      switch(args[1]) {
        case "about":
          return "usage: "
            + mostConcisePrefix
            + "info about\n"
            + "About this bot"
          ;
        case "uptime":
          return "usage: "
            + mostConcisePrefix
            + "info uptime\n"
            + "Query bot uptime"
          ;
        case "source":
          return "usage: "
            + mostConcisePrefix
            + "info source\n"
            + "Source"
          ;
        default:
          return "usage: "
            + mostConcisePrefix
            + "info "
            + "{about | uptime | source}\n"
            + "Displays (hopefully) useful information about this bot"
          ;
        //end cases
      }
    case "enter":
      switch (args[1]) {
        case "mudmaze":
          return "usage: "
            + mostConcisePrefix
            + "enter mudmaze\n"
            + "Traverse a maze live with other players"
          ;
        default:
          return "usage: "
            + mostConcisePrefix
            + "enter "
            + "{mudmaze}\n"
            + "Enters a MUD (Multi-User Dungeon)\n"
            + "*DM-only command"
          ;
        //end cases
      }
    case "roll":
      return "usage: "
        + mostConcisePrefix
        + "roll "
        + "[number of rolls]"
        + "{d2 | d3 | d4 | d6 | d8 | d10 | d12 | d20 | d100 | d%} ...\n"
        + "Roll Dungeons & Dragons dice in any combination"
      ;
    case "feedback":
      return "usage: "
        + mostConcisePrefix
        + "feedback "
        + "<feedback>\n"
        + "Send feedback to bot owner"
      ;
    /*
    case "about":
      return "usage: "
        + mostConcisePrefix
        + "about\n"
        + "Displays (hopefully) useful information about this bot"
      ;
    */
    default:
      return "usage: "
        + mostConcisePrefix
        + "help {"
        + (admins.includes(user.id) ? "admin | " : "")
        + "games | query | utils | info | enter | roll | feedback}\n"
        + "Would you like to know more?"
      ;
    //end cases
  }
}

module.exports = getHelp;
