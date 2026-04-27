import models from '../models/index.js';

async function checkSpaces() {
  const { AdSpace } = models;
  const spaces = await AdSpace.findAll({ where: { id: [7, 8] } });
  console.log(JSON.stringify(spaces.map(s => s.toJSON()), null, 2));
  process.exit(0);
}

checkSpaces();
