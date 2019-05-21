
module.exports = {
  id:     { type: String, required: true, unique: true },
  userId: String,
  email: String,
  name: String,
  avatar: String,
  bio: String,
  role: String,
  twitter: String
}
