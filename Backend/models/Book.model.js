const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    default: null 
  },
  bookName: { 
    type: String, 
    required: true,
    trim: true 
  },
  author: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String,
    trim: true 
  }
}, { timestamps: true });

// Index for better search performance
// BookSchema.index({ bookName: 1 });
// BookSchema.index({ author: 1 });

module.exports = mongoose.model("Book", BookSchema);