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
const state = global.states.galleries.pokey;

async function pokeyComponentInteraction(interaction) {
  const disabledComponents = await getDisabledComponents(interaction);
  
  await interaction.editMessage(
    interaction.message.id, { components: disabledComponents }
  );
  
  let last = 821; //latest comic at the time of this writing
  
  while (
    await fetch(
      `http://yellow5.com/pokey/archive/pokey${last + 1}.gif`,
      {method: 'HEAD', cache: 'no-store'}
    ).then(
      response => ({200: true, 404: false})[response.status]
    )
  ) last++;
  
  const createMessage = async function (id, content) {
    const result = await invokeHandler(interaction, "pokey", [id, content], 1);
    
    await print(interaction, result);
    
    auditStates(interaction, "pokey");
  }
  
  async function getFirst(content) {
    const id = 1;
    
    return await createMessage(id, content);
  }
  
  async function getPrev(content) {
    let id = state[interaction.channel.id].id;
    
    id--;
    
    return await createMessage(id, content);
  }
  
  async function getRandom(content) {
    let id;
    
    id = Math.floor(random() * last) + 1;
    
    return await createMessage(id, content);
  }
  
  async function getNext(content) {
    let id = state[interaction.channel.id].id;
    
    id++;
    
    return await createMessage(id, content);
  }
  
  async function getLast(content) {
    const id = last;
    
    return await createMessage(id, content);
  }
  
  if (interaction.data.custom_id === "pokeyFirst") await getFirst("(First)");
  if (interaction.data.custom_id === "pokeyPrev") {
    if (state[interaction.channel.id]?.id) {
      await getPrev("(Previous)");
    } else {
      await getFirst("(Previous)\nState not found, fetching earliest record!");
    }
  }
  if (interaction.data.custom_id === "pokeyRandom") await getRandom("(Random)");
  if (interaction.data.custom_id === "pokeyNext") {
    if (state[interaction.channel.id]?.id) {
      await getNext("(Next)");
    } else {
      await getLast("(Next)\nState not found, fetching most recent record!");
    }
  }
  if (interaction.data.custom_id === "pokeyLast") await getLast("(Last)");
}

module.exports = pokeyComponentInteraction;
