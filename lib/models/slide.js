var Schema = require('mongoose').Schema;

module.exports = {
  'space':  { type: Number, required: true, unique: true },
  'show':   { type: String, enum: [ 'all', 'note', 'api' ], default: 'all' },
  'chapters': { type: [{
    id: {type: Number, unique: true, required: true },
    title: String,
    description: String,
    active: { type: Boolean, default: false },
    created_at:   { type: Date, default: Date.now }
  }], default: []}
}
