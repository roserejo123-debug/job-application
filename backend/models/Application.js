const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true
    },

    companyName: {
      type: String,
      required: true,
      trim: true
    },

    jobRole: {
      type: String,
      required: true,
      trim: true
    },

    jobType: {
      type: String,
      enum: ["Full-time", "Internship", "Contract"],
      required: true
    },

    appliedDate: {
      type: Date,
      required: true
    },

    expectedSalary: {
      type: Number
    },

    notes: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: [
        "Applied",
        "Interview",
        "Offer",
        "Rejected",
        "Accepted",
        "Declined"
      ],
      default: "Applied"
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: []
    },

    followUpDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Application", applicationSchema);