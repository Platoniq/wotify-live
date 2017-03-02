
module.exports = {
  'step':     { type: Number, required: true, unique: true },
  'show':     { type: String, enum: [ 'all', 'note', 'api' ], default: 'all' },
  'slides':   { type: [
    {
      id: String,
      type: { type: String, enum:[ 'note', 'api' ], default: 'api'},
      image: String,
      domain: String,
      text: String,
      author: String,
      avatar: String,
      role: String,
      userId: Number,
      created_at:   { type: Date, default: Date.now }
    }], default: [] }
}
