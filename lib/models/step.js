
module.exports = {
  'step':     { type: Number, required: true, unique: true },
  'group':    { type: Number, required: true },
  'title':    { type: String },
  'subtitle': { type: String },
  'users':    { type: [Number] }
}
