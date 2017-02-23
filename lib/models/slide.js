
module.exports = {
  'step':     { type: Number, required: true, unique: true },
  'slides':   { type: [
    {
      id: String,
      image: String,
      domain: String,
      text: String,
      author: String,
      avatar: String,
      role: String
    }], default: [] }
}
