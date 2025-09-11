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

const { Constants } = require("eris");

const random = require("../../helpers/random.js");
const invokeHandler = require("../../helpers/invokehandler.js");
const auditStates = require("../../helpers/auditstates.js");
const print = require("../../helpers/print.js");
const getDisabledComponents = require("../../helpers/getdisabledcomponents.js");

const bot = global.bot;
const state = global.states.galleries.xkcd;

async function xkcdComponentInteraction(interaction) {
  const disabledComponents = await getDisabledComponents(interaction);
  
  await interaction.editMessage(
    interaction.message.id, { components: disabledComponents }
  );
  
  const createMessage = async function (id, content) {
    const result = await invokeHandler(interaction, "xkcd", [id, content], 1);
    
    await print(interaction, result);
    
    auditStates(interaction, "xkcd");
  }
  
  async function getFirst(content) {
    const id = 1;
    
    return await createMessage(id, content);
  }
  
  async function getPrev(content) {
    let id = state[interaction.channel.id].id;
    
    do {
      id--;
    } while (id === 404);
    
    return await createMessage(id, content);
  }
  
  async function getRandom(content) {
    let id;
    
    const latest = await fetch(
      "https://xkcd.com/info.0.json"
    ).then(response => response.json()).then(result => result.num);
    
    do {
      id = Math.floor(random() * latest) + 1;
    } while (id === 404);
    
    return await createMessage(id, content);
  }
  
  async function getNext(content) {
    let id = state[interaction.channel.id].id;
    
    do {
      id++;
    } while (id === 404);
    
    return await createMessage(id, content);
  }
  
  async function getLast(content) {
    const id = await fetch(
      "https://xkcd.com/info.0.json"
    ).then(response => response.json()).then(result => result.num);
    
    return await createMessage(id, content);
  }
  
  if (interaction.data.custom_id === "xkcdFirst") await getFirst("(First)");
  if (interaction.data.custom_id === "xkcdPrev") {
    if (state[interaction.channel.id]?.id) {
      await getPrev("(Previous)");
    } else {
      await getFirst("(Previous)\nState not found, fetching earliest record!");
    }
  }
  if (interaction.data.custom_id === "xkcdRandom") await getRandom("(Random)");
  if (interaction.data.custom_id === "xkcdNext") {
    if (state[interaction.channel.id]?.id) {
      await getNext("(Next)");
    } else {
      await getLast("(Next)\nState not found, fetching most recent record!");
    }
  }
  if (interaction.data.custom_id === "xkcdLast") await getLast("(Last)");
}

module.exports = xkcdComponentInteraction;
