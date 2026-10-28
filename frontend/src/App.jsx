import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/applications";

const statuses = [
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Accepted",
  "Declined"
];

const validNextStatuses = {
  Applied: ["Interview", "Rejected"],
  Interview: ["Offer", "Rejected"],
  Offer: ["Accepted", "Declined"],
  Rejected: [],
  Accepted: [],
  Declined: []
};

function App() {
  const [applications, setApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    jobRole: "",
    jobType: "Full-time",
    appliedDate: "",
    expectedSalary: "",
    notes: ""
  });

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [filterStatus, search]);

  const fetchApplications = async () => {
    try {
      const params = {};

      if (filterStatus) {
        params.status = filterStatus;
      }

      if (search) {
        params.search = search;
      }

      const response = await axios.get(API_URL, { params });

      setApplications(response.data.data || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not load applications"
      );
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const resetForm = () => {
    setForm({
      companyName: "",
      jobRole: "",
      jobType: "Full-time",
      appliedDate: "",
      expectedSalary: "",
      notes: ""
    });

    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.companyName || !form.jobRole || !form.appliedDate) {
      setMessage("Please fill in all required fields.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    if (!editingId && form.appliedDate > today) {
      setMessage("Applied Date cannot be a future date.");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, {
          companyName: form.companyName,
          jobRole: form.jobRole,
          jobType: form.jobType,
          expectedSalary: form.expectedSalary,
          notes: form.notes
        });

        setMessage("Application updated successfully.");
      } else {
        await axios.post(API_URL, {
          companyName: form.companyName,
          jobRole: form.jobRole,
          jobType: form.jobType,
          appliedDate: form.appliedDate,
          expectedSalary: form.expectedSalary,
          notes: form.notes
        });

        setMessage("Application added successfully.");
      }

      resetForm();
      fetchApplications();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Something went wrong."
      );
    }
  };

  const editApplication = (application) => {
    setEditingId(application._id);

    setForm({
      companyName: application.companyName,
      jobRole: application.jobRole,
      jobType: application.jobType,
      appliedDate: application.appliedDate
        ? application.appliedDate.substring(0, 10)
        : "",
      expectedSalary: application.expectedSalary || "",
      notes: application.notes || ""
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${API_URL}/${id}/status`, {
        status
      });

      setMessage("Status updated successfully.");
      fetchApplications();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Status update failed."
      );
    }
  };

  const deleteApplication = async (application) => {
    const allowed =
      application.status === "Applied" ||
      ["Rejected", "Accepted", "Declined"].includes(application.status);

    if (!allowed) {
      setMessage(
        "Applications in Interview or Offer status cannot be deleted."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete ${application.companyName} - ${application.jobRole}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${application._id}`);

      setMessage("Application deleted successfully.");
      fetchApplications();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Delete failed."
      );
    }
  };

  const countStatus = (status) => {
    return applications.filter(
      (application) => application.status === status
    ).length;
  };

  return (
    <div className="app">
      <header>
        <h1>Job Application Tracker</h1>
        <p>Track your job applications from Applied to Accepted.</p>
      </header>

      <main>
        {message && <div className="message">{message}</div>}

        <section className="form-card">
          <h2>
            {editingId ? "Edit Application" : "Add Application"}
          </h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="companyName"
              placeholder="Company Name *"
              value={form.companyName}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="jobRole"
              placeholder="Job Role *"
              value={form.jobRole}
              onChange={handleChange}
              required
            />

            <select
              name="jobType"
              value={form.jobType}
              onChange={handleChange}
            >
              <option value="Full-time">Full-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>

            <input
              type="date"
              name="appliedDate"
              value={form.appliedDate}
              onChange={handleChange}
              disabled={Boolean(editingId)}
              required
            />

            <input
              type="number"
              name="expectedSalary"
              placeholder="Expected Salary (optional)"
              value={form.expectedSalary}
              onChange={handleChange}
              min="0"
            />

            <textarea
              name="notes"
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={handleChange}
            />

            <div className="form-buttons">
              <button type="submit">
                {editingId ? "Update Application" : "Add Application"}
              </button>

              {editingId && (
                <button type="button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="stats">
          {statuses.map((status) => (
            <div key={status}>
              {status}
              <strong>{countStatus(status)}</strong>
            </div>
          ))}
        </section>

        <section className="applications">
          <h2>Applications</h2>

          <div className="filters">
            <input
              type="text"
              placeholder="Search by company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>

              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {applications.length === 0 ? (
            <p>No applications found.</p>
          ) : (
            applications.map((application) => (
              <div
                className="application-card"
                key={application._id}
              >
                <div className="card-top">
                  <div>
                    <h3>{application.companyName}</h3>
                    <p>{application.jobRole}</p>
                  </div>

                  <span
                    className={`status ${application.status}`}
                  >
                    {application.status}
                  </span>
                </div>

                <p>
                  <strong>ID:</strong>{" "}
                  {application.applicationId}
                </p>

                <p>
                  <strong>Job Type:</strong>{" "}
                  {application.jobType}
                </p>

                <p>
                  <strong>Applied:</strong>{" "}
                  {new Date(
                    application.appliedDate
                  ).toLocaleDateString()}
                </p>

                {application.expectedSalary && (
                  <p>
                    <strong>Expected Salary:</strong>{" "}
                    ₹{application.expectedSalary}
                  </p>
                )}

                {application.isOverdue && (
                  <div className="overdue">
                    Follow-up Overdue
                  </div>
                )}

                {application.notes && (
                  <p>
                    <strong>Notes:</strong>{" "}
                    {application.notes}
                  </p>
                )}

                <div className="actions">
                  {validNextStatuses[application.status].length >
                    0 && (
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          updateStatus(
                            application._id,
                            e.target.value
                          );
                        }
                      }}
                    >
                      <option value="">
                        Change Status
                      </option>

                      {validNextStatuses[
                        application.status
                      ].map((nextStatus) => (
                        <option
                          key={nextStatus}
                          value={nextStatus}
                        >
                          {nextStatus}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      editApplication(application)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={
                      application.status === "Interview" ||
                      application.status === "Offer"
                    }
                    onClick={() =>
                      deleteApplication(application)
                    }
                  >
                    Delete
                  </button>
                </div>

                {application.statusHistory &&
                  application.statusHistory.length > 0 && (
                    <div>
                      <h4>Status History</h4>

                      {application.statusHistory.map(
                        (history, index) => (
                          <p key={index}>
                            <strong>
                              {history.status}
                            </strong>{" "}
                            —{" "}
                            {new Date(
                              history.date
                            ).toLocaleString()}
                          </p>
                        )
                      )}
                    </div>
                  )}
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default App;