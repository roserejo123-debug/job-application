const express = require("express");
const router = express.Router();

const Application = require("../models/Application");

const finalStatuses = [
  "Rejected",
  "Accepted",
  "Declined"
];

const validTransitions = {
  Applied: ["Interview", "Rejected"],
  Interview: ["Offer", "Rejected"],
  Offer: ["Accepted", "Declined"]
};
async function generateApplicationId(companyName) {
  const prefix = companyName
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, "X");

  const applications = await Application.find({
    companyName: new RegExp(`^${companyName}$`, "i")
  });

  const sequence = applications.length + 1;

  return `JA-${prefix}-${String(sequence).padStart(3, "0")}`;
}
router.post("/", async (req, res) => {
  try {
    const {
      companyName,
      jobRole,
      jobType,
      appliedDate,
      expectedSalary,
      notes
    } = req.body;

    if (!companyName || !jobRole || !jobType || !appliedDate) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
        data: null
      });
    }

    const date = new Date(appliedDate);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid applied date",
        data: null
      });
    }

    if (date > new Date()) {
      return res.status(400).json({
        success: false,
        message: "Applied date cannot be in the future",
        data: null
      });
    }

    const duplicate = await Application.findOne({
      companyName: new RegExp(`^${companyName}$`, "i"),
      jobRole: new RegExp(`^${jobRole}$`, "i"),
      status: { $nin: finalStatuses }
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "An active application already exists for this company and role",
        data: null
      });
    }

    const applicationId = await generateApplicationId(companyName);

    const followUpDate = new Date(date);
    followUpDate.setDate(followUpDate.getDate() + 7);

    const application = await Application.create({
      applicationId,
      companyName,
      jobRole,
      jobType,
      appliedDate: date,
      expectedSalary,
      notes,
      status: "Applied",
      followUpDate,
      statusHistory: [
        {
          status: "Applied",
          date: new Date()
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Application created successfully",
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});
router.get("/", async (req, res) => {
  try {
    const { status, search } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.companyName = {
        $regex: search,
        $options: "i"
      };
    }

    const applications = await Application.find(query)
      .sort({ createdAt: -1 });

    const now = new Date();

    const result = applications.map((application) => {
      const obj = application.toObject();

      obj.isOverdue =
        obj.status === "Applied" &&
        new Date(obj.followUpDate) < now;

      return obj;
    });

    res.status(200).json({
      success: true,
      message: "Applications retrieved successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
        data: null
      });
    }

    const data = application.toObject();

    data.isOverdue =
      data.status === "Applied" &&
      new Date(data.followUpDate) < new Date();

    res.status(200).json({
      success: true,
      message: "Application retrieved successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});
// UPDATE APPLICATION
router.put("/:id", async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
        data: null
      });
    }

    const {
      companyName,
      jobRole,
      jobType,
      expectedSalary,
      notes
    } = req.body;

    if (!companyName || !jobRole || !jobType) {
      return res.status(400).json({
        success: false,
        message: "Company, job role and job type are required",
        data: null
      });
    }

    application.companyName = companyName;
    application.jobRole = jobRole;
    application.jobType = jobType;
    application.expectedSalary = expectedSalary;
    application.notes = notes;

    await application.save();

    res.status(200).json({
      success: true,
      message: "Application updated successfully",
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});


// CHANGE STATUS
router.patch("/:id/status", async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
        data: null
      });
    }

    const { status } = req.body;

    const allowedStatuses = validTransitions[application.status] || [];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${application.status} to ${status}`,
        data: null
      });
    }

    application.status = status;

    application.statusHistory.push({
      status: status,
      date: new Date()
    });

    await application.save();

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});


// DELETE APPLICATION
router.delete("/:id", async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
        data: null
      });
    }

    const deletableStatuses = [
      "Applied",
      "Rejected",
      "Accepted",
      "Declined"
    ];

    if (!deletableStatuses.includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: "Applications in Interview or Offer status cannot be deleted",
        data: null
      });
    }

    await Application.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Application deleted successfully",
      data: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});


module.exports = router;