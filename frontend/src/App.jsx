import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api/applications";

function App() {
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState({
    companyName: "",
    jobRole: "",
    jobType: "Full-time",
    appliedDate: "",
    expectedSalary: "",
    notes: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const loadApplications = async () => {
    try {
      const response = await axios.get(API_URL, {
        params: {
          status: statusFilter || undefined,
          search: search || undefined,
        },
      });

      setApplications(response.data.data || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not load applications"
      );
    }
  };

  useEffect(() => {
    loadApplications();
  }, [statusFilter, search]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (form.appliedDate > today) {
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
          notes: form.notes,
        });

        setMessage("Application updated successfully.");
      } else {
        await axios.post(API_URL, form);
        setMessage("Application added successfully.");
      }

      resetForm();
      loadApplications();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Something went wrong."
      );
    }
  };

  const resetForm = () => {
    setForm({
      companyName: "",
      jobRole: "",
      jobType: "Full-time",
      appliedDate: "",
      expectedSalary: "",
      notes: "",
    });

    setEditingId(null);
  };

  const editApplication = (application) => {
    setEditingId(application._id);

    setForm({
      companyName: application.companyName,
      jobRole: application.jobRole,
      jobType: application.jobType,
      appliedDate: application.appliedDate?.substring(0, 10) || "",
      expectedSalary: application.expectedSalary || "",
      notes: application.notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${API_URL}/${id}/status`, { status });
      setMessage("Status updated successfully.");
      loadApplications();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Invalid status transition."
      );
    }
  };

  const deleteApplication = async (application) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${application.applicationId}?`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${application._id}`);
      setMessage("Application deleted successfully.");
      loadApplications();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Application cannot be deleted."
      );
    }
  };

  const getNextStatuses = (status) => {
    const transitions = {
      Applied: ["Interview", "Rejected"],
      Interview: ["Offer", "Rejected"],
      Offer: ["Accepted", "Declined"],
    };

    return transitions[status] || [];
  };

  const counts = {
    Applied: applications.filter((a) => a.status === "Applied").length,
    Interview: applications.filter((a) => a.status === "Interview").length,
    Offer: applications.filter((a) => a.status === "Offer").length,
    Rejected: applications.filter((a) => a.status === "Rejected").length,
    Accepted: applications.filter((a) => a.status === "Accepted").length,
    Declined: applications.filter((a) => a.status === "Declined").length,
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
          <h2>{editingId ? "Edit Application" : "Add Application"}</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="companyName"
              placeholder="Company Name"
              value={form.companyName}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="jobRole"
              placeholder="Job Role"
              value={form.jobRole}
              onChange={handleChange}
              required
            />

            <select
              name="jobType"
              value={form.jobType}
              onChange={handleChange}
            >
              <option>Full-time</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>

            <input
              type="date"
              name="appliedDate"
              value={form.appliedDate}
              onChange={handleChange}
              max={today}
              disabled={!!editingId}
              required
            />

            <input
              type="number"
              name="expectedSalary"
              placeholder="Expected Salary (optional)"
              value={form.expectedSalary}
              onChange={handleChange}
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
          <div>Applied <strong>{counts.Applied}</strong></div>
          <div>Interview <strong>{counts.Interview}</strong></div>
          <div>Offer <strong>{counts.Offer}</strong></div>
          <div>Accepted <strong>{counts.Accepted}</strong></div>
          <div>Rejected <strong>{counts.Rejected}</strong></div>
          <div>Declined <strong>{counts.Declined}</strong></div>
        </section>

        <section className="filters">
          <input
            type="text"
            placeholder="Search by company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
            <option value="Accepted">Accepted</option>
            <option value="Declined">Declined</option>
          </select>
        </section>

        <section className="applications">
          <h2>Applications</h2>

          {applications.length === 0 ? (
            <p>No applications found.</p>
          ) : (
            applications.map((application) => {
              const nextStatuses = getNextStatuses(application.status);

              const canDelete =
                application.status === "Applied" ||
                ["Rejected", "Accepted", "Declined"].includes(
                  application.status
                );

              return (
                <article className="application-card" key={application._id}>
                  <div className="card-top">
                    <div>
                      <h3>{application.companyName}</h3>
                      <p>{application.jobRole}</p>
                    </div>

                    <span className={`status ${application.status}`}>
                      {application.status}
                    </span>
                  </div>

                  <p>
                    <strong>ID:</strong> {application.applicationId}
                  </p>

                  <p>
                    <strong>Job Type:</strong> {application.jobType}
                  </p>

                  <p>
                    <strong>Applied:</strong>{" "}
                    {new Date(application.appliedDate).toLocaleDateString()}
                  </p>

                  {application.expectedSalary && (
                    <p>
                      <strong>Expected Salary:</strong>{" "}
                      ₹{application.expectedSalary}
                    </p>
                  )}

                  {application.isOverdue &&
                    application.status === "Applied" && (
                      <div className="overdue">
                        Follow-up Overdue
                      </div>
                    )}

                  <div className="actions">
                    {nextStatuses.length > 0 && (
                      <select
                        value=""
                        onChange={(e) =>
                          updateStatus(application._id, e.target.value)
                        }
                      >
                        <option value="">Change Status</option>
                        {nextStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    )}

                    <button onClick={() => editApplication(application)}>
                      Edit
                    </button>

                    <button
                      onClick={() => deleteApplication(application)}
                      disabled={!canDelete}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}

export default App;