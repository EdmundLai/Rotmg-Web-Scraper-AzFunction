const { JSDOM } = require("jsdom");
const axios = require("axios");

module.exports = async function (context, req) {
  context.log("JavaScript HTTP trigger function processed a request.");

  const name = req.query.name || (req.body && req.body.name);

  if (name == null) {
    const errorMessage = {
      error:
        "Please provide a name in the query string to get the data on that player.",
    };

    context.res = {
      body: errorMessage,
    };
    context.res.headers = { "Content-Type": "application/json" };
    return;
  }

  const url = `https://www.realmeye.com/player/${name}`;

  const { data } = await axios(url, {
    credentials: "include",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:85.0) Gecko/20100101 Firefox/85.0",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Upgrade-Insecure-Requests": "1",
      "Cache-Control": "max-age=0",
    },
    method: "GET",
    mode: "cors",
  });

  const dom = new JSDOM(data);

  const charactersNodes = dom.window.document.querySelectorAll("#f tbody tr");

  const playerNotFoundNodes = dom.window.document.querySelector(
    ".player-not-found"
  );

  if (playerNotFoundNodes !== null) {
    const errorMessage = {
      error: "Please provide a valid username as the name in the query string.",
    };

    context.res = {
      body: errorMessage,
    };
    context.res.headers = { "Content-Type": "application/json" };
    return;
  }

  const playerData = {
    characters: [],
  };

  charactersNodes.forEach((characterNode) => {
    const infoNodes = characterNode.childNodes;

    const className = infoNodes[2].textContent;

    const level = infoNodes[3].textContent;

    const fame = infoNodes[5].textContent;

    const exp = infoNodes[6].textContent;

    const ranking = infoNodes[7].textContent;

    const equipmentNodes = infoNodes[8].childNodes;

    const characterEquipSet = {
      weapon: "",
      ability: "",
      armor: "",
      ring: "",
    };

    for (let i = 0; i < 4; i++) {
      const currEquipmentNode = equipmentNodes[i];
      const itemName =
        (currEquipmentNode &&
          currEquipmentNode.firstChild &&
          currEquipmentNode.firstChild.firstChild &&
          currEquipmentNode.firstChild.firstChild.getAttribute("title")) ||
        "Empty";
      switch (i) {
        case 0:
          characterEquipSet.weapon = itemName;
          break;
        case 1:
          characterEquipSet.ability = itemName;
          break;
        case 2:
          characterEquipSet.armor = itemName;
          break;
        case 3:
          characterEquipSet.ring = itemName;
          break;
      }
    }

    const characterInfo = {
      className,
      level,
      fame,
      exp,
      ranking,
      characterEquipSet,
    };

    playerData.characters.push(characterInfo);
  });

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: playerData,
  };

  context.res.headers = { "Content-Type": "application/json" };
};
