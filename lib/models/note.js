var Schema = require('mongoose').Schema;

module.exports = {
  id: String,
  type: { type: String, enum:[ 'note', 'api' ], default: 'api'},
  image: String,
  space: Number,
  space_id: Schema.ObjectId,
  chapter_id: Number,
  chapter: String,
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
  location: {
    type: {type: String},
    city: String,
    zip: String,
    region: String,
    country: String,
    coordinates: {type: [Number], index: '2dsphere'}
  },
  created_at:   { type: Date, default: Date.now }
}
