var Schema = require('mongoose').Schema;

module.exports = {
  'step':     { type: Number, required: true, unique: true },
  'show':     { type: String, enum: [ 'all', 'note', 'api' ], default: 'all' },
  'slides':   { type: [
    {
      id: String,
      type: { type: String, enum:[ 'note', 'api' ], default: 'api'},
      image: String,
      group: Number,
      domain: String,
      title: String,
      text: String,
      author: String,
      avatar: String,
      twitter: String,
      role: String,
      userId: Number,
      projectId: Number,
      project_id: Schema.ObjectId,
      location:     {
                    type: {type: String},
                    city: String,
                    zip: String,
                    region: String,
                    country: String,
                    coordinates: {type: [Number], index: '2dsphere'}
                  },

      created_at:   { type: Date, default: Date.now }
    }], default: [] }
}
