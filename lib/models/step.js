
module.exports = {
  'step': { type: Number,
      required: true,
      unique   : true,
      validate : {
        validator : Number.isInteger,
        message   : '{VALUE} is not an integer value'
      }
  },
  'group':    { type: Number },
  'title':    { type: String },
  'subtitle': { type: String },
  'title_footer': { type: String },
  'subtitle_footer': { type: String },
  'users':    { type: [Number] },
  'panic':    { type: Boolean, default: false }
}
