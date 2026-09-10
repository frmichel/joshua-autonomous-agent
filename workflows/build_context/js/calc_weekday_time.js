const date = new Date($('Add datetime').first().json.now);

const weekDay = date.toLocaleString(undefined, { weekday: 'long' });

const h = date.getHours().toString().padStart(2, '0');
const m = date.getMinutes().toString().padStart(2, '0');
const s = date.getSeconds().toString().padStart(2, '0');
const time = `${h}:${m}:${s}`;

return {weekDay, time}