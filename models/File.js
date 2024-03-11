const { Schema, model } = require("mongoose");

// creating schema
const fileSchema = new Schema({
  path: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  password: String,
  downloadCount: {
    type: Number,
    required: true,
    default: 0
  }
});

// creating model from
const File = model("File", fileSchema);

module.exports = File;