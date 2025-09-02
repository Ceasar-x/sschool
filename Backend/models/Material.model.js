const mongoose = require("mongoose");

const MaterialSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  content: { 
    type: String, 
    required: true,
    trim: true 
  }
}, { timestamps: true });

// Index for better query performance
// MaterialSchema.index({ userId: 1 });
// MaterialSchema.index({ title: 1 });

module.exports = mongoose.model("Material", MaterialSchema);