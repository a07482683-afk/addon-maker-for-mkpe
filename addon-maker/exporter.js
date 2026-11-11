// Генерация .mcaddon: Behavior Pack + Resource Pack
const AdmZip = require('adm-zip');
const zlib = require('zlib');
const crypto = require('crypto');

const uuid = () => crypto.randomUUID();
const json = (o) => Buffer.from(JSON.stringify(o, null, 2));

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
// Однотонная PNG-текстура 16x16 (заглушка, пока нет редактора текстур)
function solidPng(hex) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  const W = 16, raw = Buffer.alloc((W * 4 + 1) * W);
  for (let y = 0; y < W; y++) { raw[y * (W * 4 + 1)] = 0; for (let x = 0; x < W; x++) { const o = y * (W * 4 + 1) + 1 + x * 4; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(W, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const slug = (s) => String(s || 'x').toLowerCase().replace(/[^a-z0-9_]/g, '_');

function buildAddon(p) {
  const ns = slug(p.namespace), name = p.name || 'Addon';
  const bpId = uuid(), rpId = uuid(), bpMod = uuid(), rpMod = uuid();
  const ver = [1, 0, 0], eng = [1, 20, 50];
  const bp = 'BP/', rp = 'RP/';
  const zip = new AdmZip();

  zip.addFile(bp + 'manifest.json', json({
    format_version: 2,
    header: { name: name + ' BP', description: p.description || '', uuid: bpId, version: ver, min_engine_version: eng },
    modules: [{ type: 'data', uuid: bpMod, version: ver }],
    dependencies: [{ uuid: rpId, version: ver }]
  }));
  zip.addFile(rp + 'manifest.json', json({
    format_version: 2,
    header: { name: name + ' RP', description: p.description || '', uuid: rpId, version: ver, min_engine_version: eng },
    modules: [{ type: 'resources', uuid: rpMod, version: ver }]
  }));

  const itemTex = {}, blockTex = {}, lang = [];

  for (const it of p.items || []) {
    const id = slug(it.id);
    const comps = {
      'minecraft:max_stack_size': Number(it.stack) || 64,
      'minecraft:icon': { textures: { default: ns + '_' + id } },
      'minecraft:display_name': { value: it.name || id }
    };
    if (it.durability > 0) comps['minecraft:durability'] = { max_durability: Number(it.durability) };
    if (it.damage > 0) comps['minecraft:damage'] = Number(it.damage);
    if (it.hand_equipped) comps['minecraft:hand_equipped'] = true;
    zip.addFile(bp + `items/${id}.json`, json({
      format_version: '1.20.50',
      'minecraft:item': { description: { identifier: `${ns}:${id}`, menu_category: { category: it.category || 'equipment' } }, components: comps }
    }));
    zip.addFile(rp + `textures/items/${ns}_${id}.png`, solidPng(it.color || '#888888'));
    itemTex[ns + '_' + id] = { textures: `textures/items/${ns}_${id}` };
    lang.push(`item.${ns}:${id}.name=${it.name || id}`);
  }

  for (const b of p.blocks || []) {
    const id = slug(b.id);
    const comps = {
      'minecraft:destructible_by_mining': { seconds_to_destroy: Number(b.hardness) || 1 },
      'minecraft:destructible_by_explosion': { explosion_resistance: Number(b.resistance) || 1 },
      'minecraft:light_emission': Math.max(0, Math.min(15, Number(b.light) || 0)),
      'minecraft:material_instances': { '*': { texture: ns + '_' + id, render_method: 'opaque' } }
    };
    zip.addFile(bp + `blocks/${id}.json`, json({
      format_version: '1.20.50',
      'minecraft:block': { description: { identifier: `${ns}:${id}`, menu_category: { category: 'construction' } }, components: comps }
    }));
    zip.addFile(rp + `textures/blocks/${ns}_${id}.png`, solidPng(b.color || '#777777'));
    blockTex[ns + '_' + id] = { textures: `textures/blocks/${ns}_${id}` };
    lang.push(`tile.${ns}:${id}.name=${b.name || id}`);
  }

  zip.addFile(rp + 'textures/item_texture.json', json({ resource_pack_name: ns, texture_name: 'atlas.items', texture_data: itemTex }));
  zip.addFile(rp + 'textures/terrain_texture.json', json({ resource_pack_name: ns, texture_name: 'atlas.terrain', padding: 8, num_mip_levels: 4, texture_data: blockTex }));
  if (Object.keys(blockTex).length) {
    const bd = {}; for (const b of p.blocks) bd[`${ns}:${slug(b.id)}`] = { sound: 'stone' };
    zip.addFile(rp + 'blocks.json', json(Object.assign({ format_version: [1, 1, 0] }, bd)));
  }
  zip.addFile(rp + 'texts/languages.json', json(['en_US']));
  zip.addFile(rp + 'texts/en_US.lang', Buffer.from(lang.join('\n') + '\n'));
  return zip.toBuffer();
}
module.exports = { buildAddon };
