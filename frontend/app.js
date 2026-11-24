// const API_URL = "http://127.0.0.1:8000";
const API_URL = "https://hirehub-backend-s2o2.onrender.com";

// =====================================================
// NOTIFICATIONS
// =====================================================

async function loadNotifications() {
    const container = document.getElementById(
        "notificationsContainer"
    );

    const countElement = document.getElementById(
        "unreadNotificationCount"
    );

    // This page does not contain the notification section
    if (!container) {
        return;
    }

    const token = sessionStorage.getItem("access_token");

    if (!token) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/api/notifications/`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const notifications = await response.json();

        if (!response.ok) {
            container.textContent = "Unable to load notifications.";
            return;
        }

        // Display notifications
        container.innerHTML = "";

        if (notifications.length === 0) {
            container.textContent = "You have no notifications.";
        }

        notifications.forEach(notification => {
            const card = document.createElement("div");
            card.className = "notification-card";

            const message = document.createElement("p");
            message.textContent = notification.message;

            const date = document.createElement("small");
            date.textContent = new Date(
                notification.created_at
            ).toLocaleString();

            card.appendChild(message);
            card.appendChild(date);

            if (!notification.is_read) {
                card.classList.add("unread");

                const button = document.createElement("button");
                button.textContent = "Mark as Read";

                button.addEventListener("click", async () => {
                    await markNotificationRead(notification.id);
                });

                card.appendChild(button);
            } else {
                const readLabel = document.createElement("small");
                readLabel.textContent = "Read";
                card.appendChild(readLabel);
            }

            container.appendChild(card);
        });

        // Update unread count
        const countResponse = await fetch(
            `${API_URL}/api/notifications/unread-count`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const countData = await countResponse.json();

        if (countResponse.ok && countElement) {
            countElement.textContent = countData.unread_count;
        }
    } catch (error) {
        console.error("Notification loading error:", error);
        container.textContent = "Unable to connect to the server.";
    }
}


// Mark a notification as read
async function markNotificationRead(notificationId) {
    const token = sessionStorage.getItem("access_token");

    try {
        const response = await fetch(
            `${API_URL}/api/notifications/${notificationId}/read`,
            {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            alert("Unable to mark notification as read.");
            return;
        }

        // Refresh notifications and unread count
        loadNotifications();

    } catch (error) {
        console.error("Mark notification error:", error);
    }
}


// =====================================================
// LOGIN
// =====================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const message = document.getElementById("loginMessage");

        message.textContent = "Logging in...";

        try {

            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            console.log("Login status:", response.status);

            const data = await response.json();

            console.log("Login response:", data);

            if (!response.ok) {

                message.textContent =
                    data.detail || "Login failed.";

                return;
            }


            // ==========================================
            // SAVE JWT TOKEN
            // ==========================================

            if (!data.access_token) {

                message.textContent =
                    "Login succeeded, but no access token was received.";

                console.error(
                    "No access_token in response:",
                    data
                );

                return;
            }

            sessionStorage.setItem(
                "access_token",
                data.access_token
            );


            // ==========================================
            // SAVE USER INFORMATION IF AVAILABLE
            // ==========================================

            if (data.user) {

                sessionStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );
            }


// ==========================================
// SUCCESS + ROLE-BASED REDIRECTION
// ==========================================

message.textContent =
    "Login successful! Redirecting...";

console.log("JWT saved successfully.");


try {

    const userResponse = await fetch(
        `${API_URL}/api/auth/me`,
        {
            method: "GET",
            headers: {
                "Authorization":
                    `Bearer ${data.access_token}`
            }
        }
    );

    const user = await userResponse.json();

    console.log("Logged in user:", user);

    // Save complete user information
    sessionStorage.setItem(
        "user",
        JSON.stringify(user)
    );


// ==========================================
// REDIRECT BASED ON USER ROLE
// ==========================================

if (user.role === "recruiter") {

    window.location.href =
        "recruiter-dashboard.html";

} else if (user.role === "admin") {

    window.location.href =
        "admin-dashboard.html";

} else {

    window.location.href =
        "dashboard.html";
}


} catch (error) {

    console.error(
        "User information error:",
        error
    );

    // Fallback
    window.location.href =
        "dashboard.html";
}

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            message.textContent =
                "Unable to connect to the server. Check the browser console.";

        }

    });

}



// ======================================================
// REGISTER
// ======================================================

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const name =
                document.getElementById(
                    "registerName"
                ).value;


            const email =
                document.getElementById(
                    "registerEmail"
                ).value;


            const password =
                document.getElementById(
                    "registerPassword"
                ).value;


            const role =
                document.getElementById(
                    "registerRole"
                ).value;


            const message =
                document.getElementById(
                    "registerMessage"
                );


            try {

                const response = await fetch(
                    `${API_URL}/api/auth/register`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            name: name,
                            email: email,
                            password: password,
                            role: role
                        })
                    }
                );


                const data =
                    await response.json();


                if (!response.ok) {

                    message.innerHTML =
                        `<div class="alert alert-danger">
                            ${data.detail ||
                            "Registration failed."}
                        </div>`;

                    return;
                }


                message.innerHTML =
                    `<div class="alert alert-success">
                        Registration successful!
                        <a href="login.html">
                            Login now
                        </a>
                    </div>`;

            }


            catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                message.innerHTML =
                    `<div class="alert alert-danger">
                        Unable to connect to server.
                    </div>`;

            }

        }
    );

}


// ======================================================
// LOAD JOBS
// ======================================================

async function loadHomePageJobs() {

    const container =
        document.getElementById(
            "jobsContainer"
        );


    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/jobs/`
            );


        const jobs =
            await response.json();


        if (!response.ok) {

            container.innerHTML =
                `<div class="alert alert-danger">
                    Unable to load jobs.
                </div>`;

            return;
        }


        container.innerHTML = "";


        jobs.forEach(job => {

            container.innerHTML += `

                <div class="col-md-4 mb-4">

                    <div class="card job-card shadow-sm h-100">

                        <div class="card-body">

                            <h5 class="card-title">
                                ${job.title}
                            </h5>


                            <p class="text-muted">
                                ${job.location ||
                                "Location not specified"}
                            </p>


                            <p>
                                ${job.description || ""}
                            </p>


                            <p>
                                <strong>
                                    Experience:
                                </strong>

                                ${job.experience_level ||
                                "N/A"}
                            </p>


                            <p>
                                <strong>
                                    Skills:
                                </strong>

                                ${job.skills || "N/A"}
                            </p>


                            <button
                                class="btn btn-primary"
                                onclick="applyForJob(${job.id})"
                            >
                                Apply
                            </button>

                        </div>

                    </div>

                </div>

            `;

        });

    }


    catch (error) {

        console.error(
            "Job loading error:",
            error
        );

        container.innerHTML =
            `<div class="alert alert-danger">
                Unable to connect to backend.
            </div>`;

    }

}

// ===============================
// APPLY FOR JOB
// ===============================

async function applyForJob(jobId) {

    // Get JWT token from sessionStorage
    const token = sessionStorage.getItem("access_token");

    // Check login
    if (!token) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/jobs/${jobId}/apply`,
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },

                // Backend expects ApplicationCreate
                body: JSON.stringify({
                    cover_letter: null
                })
            }
        );

        const data = await response.json();

        console.log("Apply response:", data);

        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to apply for this job."
            );

            return;
        }

        alert(
            data.message ||
            "Application submitted successfully!"
        );

    } catch (error) {

        console.error("Application error:", error);

        alert("Unable to connect to the server.");
    }
}

// ======================================================
// LOAD JOBS ON HOME PAGE
// ======================================================

if (
    document.getElementById(
        "jobsContainer"
    )
) {

    loadHomePageJobs();

}

// =====================================================
// DASHBOARD
// =====================================================

const jobsContainer = document.getElementById("jobsContainer");
const jobSearch = document.getElementById("jobSearch");
const welcomeMessage = document.getElementById("welcomeMessage");
const userInfo = document.getElementById("userInfo");
const logoutButton = document.getElementById("logoutButton");

let allJobs = [];
let smartMatchByJobId = {};
// Job filter elements
const locationFilter = document.getElementById("locationFilter");
const experienceFilter = document.getElementById("experienceFilter");
const employmentFilter = document.getElementById("employmentFilter");
const remoteFilter = document.getElementById("remoteFilter");
const minSalaryFilter = document.getElementById("minSalaryFilter");
const maxSalaryFilter = document.getElementById("maxSalaryFilter");
const clearFilters = document.getElementById("clearFilters");

let jobFilterTimeout;


// =====================================================
// CHECK LOGIN
// =====================================================

const token = sessionStorage.getItem("access_token");

if (jobsContainer && !token) {

    alert("Please login first.");

    window.location.href = "login.html";
}


// =====================================================
// LOAD USER INFORMATION
// =====================================================

async function loadUser() {

    if (!token) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/auth/me`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        if (!response.ok) {

            sessionStorage.removeItem("access_token");

            window.location.href = "login.html";

            return;
        }


        const user = await response.json();

        console.log("Logged in user:", user);


        welcomeMessage.textContent =
            `Welcome to HireHub, ${user.name}!`;

        userInfo.textContent =
            `Email: ${user.email} | Role: ${user.role}`;

    }

    catch (error) {

        console.error(
            "Error loading user:",
            error
        );

    }

}

// =====================================================
// LOAD JOBS WITH SEARCH AND FILTERS
// =====================================================

async function loadJobs() {

    if (!jobsContainer) {
        return;
    }

    try {

        // Collect filter values
        const params = new URLSearchParams();

        const keyword = jobSearch?.value.trim();
        const location = locationFilter?.value;
        const experience = experienceFilter?.value;
        const employment = employmentFilter?.value;
        const remote = remoteFilter?.value;
        const minSalary = minSalaryFilter?.value;
        const maxSalary = maxSalaryFilter?.value;

        // Add only filters that have values
        if (keyword) {
            params.append("keyword", keyword);
        }

        if (location) {
            params.append("location", location);
        }

        if (experience) {
            params.append("experience_level", experience);
        }

        if (employment) {
            params.append("employment_type", employment);
        }

        if (remote !== "" && remote !== null && remote !== undefined) {
            params.append("is_remote", remote);
        }

        if (minSalary) {
            params.append("min_salary", minSalary);
        }

        if (maxSalary) {
            params.append("max_salary", maxSalary);
        }

        const queryString = params.toString();

        const url = queryString
            ? `${API_URL}/api/jobs/?${queryString}`
            : `${API_URL}/api/jobs/`;

        // Fetch filtered jobs from backend
        const response = await fetch(url);

        if (!response.ok) {

            jobsContainer.innerHTML =
                "<p>Unable to load jobs.</p>";

            return;
        }

        const jobs = await response.json();

        console.log("Filtered Jobs:", jobs);

        allJobs = jobs;

        // Update available jobs count
        const jobCount = document.getElementById("jobCount");

        if (jobCount) {
            jobCount.textContent = jobs.length;
        }

        // Display the jobs
        displayJobs(jobs);

    }

    catch (error) {

        console.error(
            "Error loading jobs:",
            error
        );

        jobsContainer.innerHTML =
            "<p>Unable to connect to the server.</p>";
    }
}


// =====================================================
// DISPLAY JOBS
// =====================================================

// =====================================================
// DISPLAY JOBS
// =====================================================


function displayJobs(jobs) {

    jobsContainer.innerHTML = "";

    if (!jobs || jobs.length === 0) {
        jobsContainer.innerHTML =
            "<p>No jobs available.</p>";
        return;
    }

    jobs.forEach(job => {

        const jobCard = document.createElement("div");
        jobCard.className = "job-card";

        const match = smartMatchByJobId[job.id];

        let matchHTML = "";

        if (match) {
            matchHTML = `
                <h3 class="smartmatch-score">
                    SmartMatch: ${match.match_score}%
                </h3>
            `;
        }

        jobCard.innerHTML = `
            <h3>${job.title}</h3>

            ${matchHTML}

            <p>
                <strong>Location:</strong>
                ${job.location || "Not specified"}
            </p>

            <p>
                <strong>Experience:</strong>
                ${job.experience_level || "Not specified"}
            </p>

            <p>
                <strong>Employment:</strong>
                ${job.employment_type || "Not specified"}
            </p>

            <p>
                <strong>Skills:</strong>
                ${job.skills || "Not specified"}
            </p>

            <p>
                ${job.description || ""}
            </p>

            <div class="job-actions">

                <button
                    class="apply-button"
                    onclick="applyForJob(${job.id})"
                >
                    Apply Now
                </button>

                <button
                    class="secondary-button"
                    onclick="toggleSavedJob(${job.id})"
                >
                    Save Job
                </button>

            </div>
        `;

        jobsContainer.appendChild(jobCard);
    });
}

// =====================================================
// SEARCH AND FILTER EVENT LISTENERS
// =====================================================

function applyJobFilters() {

    // Debounce search requests while the user is typing
    clearTimeout(jobFilterTimeout);

    jobFilterTimeout = setTimeout(() => {
        loadJobs();
    }, 300);
}


// Search by keyword
if (jobSearch) {
    jobSearch.addEventListener(
        "input",
        applyJobFilters
    );
}


// Location filter
if (locationFilter) {
    locationFilter.addEventListener(
        "change",
        applyJobFilters
    );
}


// Experience filter
if (experienceFilter) {
    experienceFilter.addEventListener(
        "change",
        applyJobFilters
    );
}


// Employment type filter
if (employmentFilter) {
    employmentFilter.addEventListener(
        "change",
        applyJobFilters
    );
}


// Remote / On-site filter
if (remoteFilter) {
    remoteFilter.addEventListener(
        "change",
        applyJobFilters
    );
}


// Minimum salary filter
if (minSalaryFilter) {
    minSalaryFilter.addEventListener(
        "input",
        applyJobFilters
    );
}


// Maximum salary filter
if (maxSalaryFilter) {
    maxSalaryFilter.addEventListener(
        "input",
        applyJobFilters
    );
}


// Clear all filters
if (clearFilters) {

    clearFilters.addEventListener(
        "click",
        function () {

            if (jobSearch) jobSearch.value = "";
            if (locationFilter) locationFilter.value = "";
            if (experienceFilter) experienceFilter.value = "";
            if (employmentFilter) employmentFilter.value = "";
            if (remoteFilter) remoteFilter.value = "";
            if (minSalaryFilter) minSalaryFilter.value = "";
            if (maxSalaryFilter) maxSalaryFilter.value = "";

            loadJobs();
        }
    );
}


// =====================================================
// APPLY FOR JOB
// =====================================================

async function applyForJob(jobId) {

    if (!token) {

        alert("Please login first.");

        window.location.href = "login.html";

        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/jobs/${jobId}/apply`,
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    cover_letter: null
                })
            }
        );

        const data = await response.json();

        console.log("Apply response:", data);

        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to apply for this job."
            );

            return;
        }

        alert(
            data.message ||
            "Application submitted successfully!"
        );

    } catch (error) {

        console.error("Application error:", error);

        alert("Unable to connect to the server.");

    }

}

// =====================================================
// LOGOUT
// =====================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            sessionStorage.removeItem(
                "access_token"
            );

            sessionStorage.removeItem(
                "user"
            );

            window.location.href =
                "login.html";

        }
    );

}

// =====================================================
// START DASHBOARD
// =====================================================

if (jobsContainer) {

    loadUser();

    loadJobs();

}

// =====================================================
// LOAD MY APPLICATIONS
// =====================================================

async function loadMyApplications() {

    const applicationsContainer =
        document.getElementById("applicationsContainer");

    const applicationCount =
        document.getElementById("applicationCount");


    if (!applicationsContainer) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/api/jobs/my-applications`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        const applications =
            await response.json();


        console.log(
            "My Applications:",
            applications
        );


        if (!response.ok) {

            applicationsContainer.innerHTML =
                `<p>Unable to load applications.</p>`;

            return;
        }


        // Update application count

        if (applicationCount) {

            applicationCount.textContent =
                applications.length;

        }


        // No applications

        if (applications.length === 0) {

            applicationsContainer.innerHTML =
                `<p>You haven't applied for any jobs yet.</p>`;

            return;
        }

        // Display applications

        applicationsContainer.innerHTML = "";

        applications.forEach(application => {

            const applicationCard =
                document.createElement("div");


            applicationCard.className =
                "application-card";


            applicationCard.innerHTML = `

                <h3>
                    Application #${application.id}
                </h3>

                <p>
                    <strong>Job ID:</strong>
                    ${application.job_id}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${application.status}
                </p>

                <p>
                    <strong>Applied On:</strong>
                    ${application.applied_at || "N/A"}
                </p>

            `;

            applicationsContainer.appendChild(
                applicationCard
            );

        });

    }

    catch (error) {

        console.error(
            "Application loading error:",
            error
        );


        applicationsContainer.innerHTML =
            `<p>Unable to connect to server.</p>`;

    }

}

// =====================================================
// START CANDIDATE DASHBOARD
// =====================================================

if (
    document.getElementById("welcomeMessage") &&
    document.getElementById("applicationsContainer")
) {

    loadMyApplications();

    loadNotifications();

    loadSmartMatchRecommendations();

}

// =====================================================
// RECRUITER DASHBOARD
// =====================================================

const recruiterInfo =
    document.getElementById("recruiterInfo");

const jobForm =
    document.getElementById("jobForm");

const myJobsContainer =
    document.getElementById("myJobsContainer");

const recruiterApplicationsContainer =
    document.getElementById("applicationsContainer");

// =====================================================
// LOAD RECRUITER INFORMATION
// =====================================================

async function loadRecruiterInfo() {

    const token =
        sessionStorage.getItem("access_token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/api/auth/me`,
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const user =
            await response.json();

        if (!response.ok) {

            window.location.href =
                "login.html";

            return;
        }

        if (user.role !== "recruiter") {

            alert(
                "Only recruiters can access this dashboard."
            );

            window.location.href =
                "dashboard.html";

            return;
        }

        if (recruiterInfo) {

            recruiterInfo.textContent =
                `Welcome, ${user.name}! | Email: ${user.email} | Role: ${user.role}`;
        }

    }
    catch (error) {

        console.error(
            "Recruiter information error:",
            error
        );

        if (recruiterInfo) {

            recruiterInfo.textContent =
                "Unable to load recruiter information.";
        }
    }
}


// =====================================================
// POST NEW JOB
// =====================================================

if (jobForm) {

    jobForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const token =
                sessionStorage.getItem(
                    "access_token"
                );

            if (!token) {

                alert("Please login first.");

                window.location.href =
                    "login.html";

                return;
            }


            const deadlineValue =
                document.getElementById(
                    "applicationDeadline"
                ).value;


            const jobData = {

                title:
                    document.getElementById(
                        "jobTitle"
                    ).value,

                description:
                    document.getElementById(
                        "jobDescription"
                    ).value,

                skills:
                    document.getElementById(
                        "jobSkills"
                    ).value,

                experience_level:
                    document.getElementById(
                        "experienceLevel"
                    ).value,

                employment_type:
                    document.getElementById(
                        "employmentType"
                    ).value,

                location:
                    document.getElementById(
                        "jobLocation"
                    ).value,

                is_remote:
                    document.getElementById(
                        "isRemote"
                    ).checked,

                salary_min:
                    Number(
                        document.getElementById(
                            "salaryMin"
                        ).value
                    ) || null,

                salary_max:
                    Number(
                        document.getElementById(
                            "salaryMax"
                        ).value
                    ) || null,

                openings:
                    Number(
                        document.getElementById(
                            "openings"
                        ).value
                    ),

                application_deadline:
                    deadlineValue
                        ? `${deadlineValue}T23:59:59`
                        : null
            };


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/jobs/`,
                        {
                            method: "POST",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`,

                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    jobData
                                )
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    document.getElementById(
                        "jobMessage"
                    ).textContent =
                        data.detail ||
                        "Unable to create job.";

                    return;
                }


                document.getElementById(
                    "jobMessage"
                ).textContent =
                    "Job posted successfully! It is waiting for admin approval.";


                jobForm.reset();


                document.getElementById(
                    "openings"
                ).value = 1;


                loadRecruiterJobs();

            }
            catch (error) {

                console.error(
                    "Job creation error:",
                    error
                );

                document.getElementById(
                    "jobMessage"
                ).textContent =
                    "Unable to connect to the server.";
            }

        }
    );
}


// =====================================================
// LOAD RECRUITER'S JOBS
// =====================================================

// =====================================================
// LOAD RECRUITER'S JOBS
// =====================================================

async function loadRecruiterJobs() {

    if (!myJobsContainer) {
        return;
    }


    const token =
        sessionStorage.getItem(
            "access_token"
        );


    if (!token) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/jobs/my-jobs`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const jobs =
            await response.json();


        if (!response.ok) {

            myJobsContainer.innerHTML =
                `<p>
                    Unable to load your jobs.
                </p>`;

            return;
        }


        if (
            !jobs ||
            jobs.length === 0
        ) {

            myJobsContainer.innerHTML =
                `<p>
                    You haven't posted any jobs yet.
                </p>`;

            return;
        }


        myJobsContainer.innerHTML = "";


        jobs.forEach(job => {

            const jobCard =
                document.createElement(
                    "div"
                );


            jobCard.className =
                "job-card";


            jobCard.innerHTML = `

                <h3>
                    ${job.title}
                </h3>

                <p>
                    <strong>Job ID:</strong>
                    ${job.id}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${job.location || "N/A"}
                </p>

                <p>
                    <strong>Experience:</strong>
                    ${job.experience_level || "N/A"}
                </p>

                <p>
                    <strong>Employment:</strong>
                    ${job.employment_type || "N/A"}
                </p>

                <p>
                    <strong>Skills:</strong>
                    ${job.skills || "N/A"}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${job.status || "N/A"}
                </p>


                <div class="job-actions">

                    <button
                        type="button"
                        onclick="editRecruiterJob(${job.id})"
                    >
                        Edit Job
                    </button>


                    ${
                        job.status !== "closed"
                        ? `
                            <button
                                type="button"
                                class="danger-button"
                                onclick="closeRecruiterJob(${job.id})"
                            >
                                Close Job
                            </button>
                        `
                        : `
                            <button
                                type="button"
                                disabled
                            >
                                Closed
                            </button>
                        `
                    }


                    <button
                        type="button"
                        onclick="loadJobApplications(${job.id})"
                    >
                        View Applications
                    </button>

                </div>

            `;


            myJobsContainer.appendChild(
                jobCard
            );

        });

    }


    catch (error) {

        console.error(
            "Recruiter jobs error:",
            error
        );

        myJobsContainer.innerHTML =
            `<p>
                Unable to connect to the server.
            </p>`;
    }

}

// =====================================================
// LOAD APPLICATIONS FOR A JOB
// =====================================================

async function loadJobApplications(jobId) {

    if (!recruiterApplicationsContainer) {
        return;
    }


    const token =
        sessionStorage.getItem(
            "access_token"
        );


    try {

        const response =
            await fetch(
                `${API_URL}/api/smartmatch/jobs/${jobId}/applicants`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const applications =
            await response.json();


        if (!response.ok) {

            recruiterApplicationsContainer.innerHTML =
                `<p>
                    Unable to load applications.
                </p>`;

            return;
        }


        if (
            !applications ||
            applications.length === 0
        ) {

            recruiterApplicationsContainer.innerHTML =
                `<p>
                    No applications received for this job yet.
                </p>`;

            return;
        }


        recruiterApplicationsContainer.innerHTML =
            `<h3>
                Applicants for Job #${jobId}
            </h3>`;



        applications.forEach(application => {

            const card = document.createElement("div");

            card.className = "application-card";

            const matchedSkills =
                application.matched_skills.length
                    ? application.matched_skills.join(", ")
                    : "None";

            const missingSkills =
                application.missing_skills.length
                    ? application.missing_skills.join(", ")
                    : "None";

            card.innerHTML = `

                <h3>
                    ${application.candidate_name}
                </h3>

                <p>
                    <strong>Application ID:</strong>
                    ${application.application_id}
                </p>

                <h3 class="smartmatch-score">
                    Compatibility: ${application.match_score}%
                </h3>

                <p>
                    <strong>Matched Skills:</strong>
                    ${matchedSkills}
                </p>

                <p>
                    <strong>Skills to Improve:</strong>
                    ${missingSkills}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${application.status}
                </p>

                <p>
                    <strong>Cover Letter:</strong>
                    ${application.cover_letter || "Not provided"}
                </p>

                <select id="status-${application.application_id}">

                    <option value="applied">Applied</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                    <option value="accepted">Accepted</option>

                </select>

                <button
                    type="button"
                    onclick="updateApplicationStatus(${application.application_id})"
                >
                    Update Status
                </button>

            `;

            recruiterApplicationsContainer.appendChild(card);

        });

    }
    catch (error) {

        console.error(
            "Application loading error:",
            error
        );

        recruiterApplicationsContainer.innerHTML =
            `<p>
                Unable to connect to the server.
            </p>`;
    }
}


// =====================================================
// SMARTMATCH - CANDIDATE RECOMMENDATIONS
// =====================================================


async function loadSmartMatchRecommendations() {

    const container = document.getElementById(
        "recommendationsContainer"
    );

    if (!container) return;

    const token = sessionStorage.getItem("access_token");

    if (!token) {
        container.textContent =
            "Please login to view recommendations.";
        return;
    }

    container.textContent = "Loading recommendations...";

    try {

        const response = await fetch(
            `${API_URL}/api/smartmatch/recommendations`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const recommendations = await response.json();

        if (!response.ok) {
            container.textContent =
                recommendations.detail ||
                "Unable to load recommendations.";

            smartMatchByJobId = {};
            return;
        }

        if (!Array.isArray(recommendations)) {
            container.textContent =
                "Invalid recommendations response.";
            return;
        }

        // Store scores for the Available Jobs section
        smartMatchByJobId = {};

        recommendations.forEach(job => {
            smartMatchByJobId[job.job_id] = job;
        });

        // Refresh job cards with their matching scores
        if (typeof allJobs !== "undefined" && allJobs.length > 0) {
            displayJobs(allJobs);
        }

        // Display the top three recommendations
        const topThree = recommendations
            .filter(job => job.recommended)
            .slice(0, 3);

        if (topThree.length === 0) {
            container.textContent =
                "No matching jobs available yet.";
            return;
        }

        container.innerHTML = "";

        topThree.forEach(job => {

            const card = document.createElement("div");
            card.className = "application-card";

            const matchedSkills =
                job.matched_skills.length
                    ? job.matched_skills.join(", ")
                    : "None";

            const missingSkills =
                job.missing_skills.length
                    ? job.missing_skills.join(", ")
                    : "None";

            card.innerHTML = `
                <h3>${job.title}</h3>

                <p>
                    <strong>Location:</strong>
                    ${job.location || "Not specified"}
                </p>

                <h3>
                    Compatibility: ${job.match_score}%
                </h3>

                <p>
                    <strong>Matched Skills:</strong>
                    ${matchedSkills}
                </p>

                <p>
                    <strong>Skills to Improve:</strong>
                    ${missingSkills}
                </p>

                <button
                    onclick="applyForJob(${job.job_id})"
                >
                    Apply Now
                </button>
            `;

            container.appendChild(card);
        });

    } catch (error) {

        console.error("SmartMatch error:", error);

        container.textContent =
            "Unable to connect to SmartMatch.";
    }
}

// =====================================================
// UPDATE APPLICATION STATUS
// =====================================================

async function updateApplicationStatus(
    applicationId
) {

    const token =
        sessionStorage.getItem(
            "access_token"
        );


    const status =
        document.getElementById(
            `status-${applicationId}`
        ).value;


    try {

        const response =
            await fetch(
                `${API_URL}/api/jobs/applications/${applicationId}/status`,
                {
                    method: "PUT",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            status: status
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to update application status."
            );

            return;
        }


        alert(
            "Application status updated successfully!"
        );

    }
    catch (error) {

        console.error(
            "Status update error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );
    }
}

// =====================================================
// START RECRUITER DASHBOARD
// =====================================================
if (
    document.getElementById(
        "recruiterInfo"
    )
) {

    loadRecruiterInfo();
    loadRecruiterJobs();
    loadNotifications();
}

// =====================================================
// ADMIN DASHBOARD
// =====================================================

async function loadAdminDashboard() {

    const adminInfo =
        document.getElementById("adminInfo");

    if (!adminInfo) {
        return;
    }

    const token =
        sessionStorage.getItem("access_token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }


    // ==========================================
    // LOAD ADMIN INFORMATION
    // ==========================================

    try {

        const userResponse = await fetch(
            `${API_URL}/api/auth/me`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        const user = await userResponse.json();


        if (!userResponse.ok) {

            adminInfo.textContent =
                "Unable to load admin information.";

            return;
        }


        if (user.role !== "admin") {

            alert(
                "Access denied. Admins only."
            );

            window.location.href =
                "dashboard.html";

            return;
        }


        adminInfo.textContent =
            `Welcome, ${user.name}! | Email: ${user.email} | Role: ${user.role}`;


    } catch (error) {

        console.error(
            "Admin information error:",
            error
        );

        adminInfo.textContent =
            "Unable to connect to server.";

        return;
    }


    // ==========================================
    // LOAD DASHBOARD STATISTICS
    // ==========================================

    try {

        const response = await fetch(
            `${API_URL}/api/admin/dashboard`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Admin dashboard error:",
                data
            );

            return;
        }


        document.getElementById(
            "totalUsers"
        ).textContent =
            data.total_users;


        document.getElementById(
            "totalCandidates"
        ).textContent =
            data.total_candidates;


        document.getElementById(
            "totalRecruiters"
        ).textContent =
            data.total_recruiters;


        document.getElementById(
            "totalJobs"
        ).textContent =
            data.total_jobs;


        document.getElementById(
            "approvedJobs"
        ).textContent =
            data.approved_jobs;


        document.getElementById(
            "totalApplications"
        ).textContent =
            data.total_applications;


        document.getElementById(
            "shortlistedApplications"
        ).textContent =
            data.shortlisted_applications;


        document.getElementById(
            "totalInterviews"
        ).textContent =
            data.total_interviews;


    } catch (error) {

        console.error(
            "Dashboard statistics error:",
            error
        );
    }


    // ==========================================
    // LOAD PENDING JOBS
    // ==========================================

    loadPendingJobs();
}


// =====================================================
// LOAD PENDING JOBS
// =====================================================

async function loadPendingJobs() {

    const container =
        document.getElementById(
            "pendingJobsContainer"
        );


    if (!container) {
        return;
    }


    const token =
        sessionStorage.getItem("access_token");


    try {

        const response = await fetch(
            `${API_URL}/api/admin/jobs/pending`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        const jobs =
            await response.json();


        if (!response.ok) {

            container.innerHTML =
                "<p>Unable to load pending jobs.</p>";

            console.error(
                "Pending jobs error:",
                jobs
            );

            return;
        }


        if (jobs.length === 0) {

            container.innerHTML =
                "<p>No pending jobs.</p>";

            return;
        }


        container.innerHTML = "";


        jobs.forEach(job => {

            const card =
                document.createElement("div");


            card.className =
                "application-card";


            card.innerHTML = `

                <h3>
                    ${job.title}
                </h3>

                <p>
                    <strong>Job ID:</strong>
                    ${job.id}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${job.location}
                </p>

                <p>
                    <strong>Experience:</strong>
                    ${job.experience_level}
                </p>

                <p>
                    <strong>Employment:</strong>
                    ${job.employment_type}
                </p>

                <p>
                    <strong>Skills:</strong>
                    ${job.skills}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${job.status}
                </p>

                <button
                    onclick="approveJob(${job.id})"
                >
                    Approve Job
                </button>

            `;


            container.appendChild(card);

        });


    } catch (error) {

        console.error(
            "Pending jobs loading error:",
            error
        );

        container.innerHTML =
            "<p>Unable to connect to server.</p>";
    }
}


// =====================================================
// APPROVE JOB
// =====================================================

async function approveJob(jobId) {

    const token =
        sessionStorage.getItem("access_token");


    try {

        const response = await fetch(

            `${API_URL}/api/admin/jobs/${jobId}/approve`,

            {
                method: "PUT",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }

        );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to approve job."
            );

            return;
        }


        alert(
            "Job approved successfully!"
        );


        // Reload statistics and pending jobs
        loadAdminDashboard();


    } catch (error) {

        console.error(
            "Job approval error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}


// =====================================================
// START ADMIN DASHBOARD
// =====================================================

if (
    document.getElementById(
        "pendingJobsContainer"
    )
) {

    loadAdminDashboard();

}

// =====================================================
// INTERVIEW SCHEDULING
// =====================================================

const interviewForm =
    document.getElementById("interviewForm");


// -----------------------------------------------------
// SCHEDULE INTERVIEW
// -----------------------------------------------------

if (interviewForm) {

    interviewForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const applicationId =
                document.getElementById(
                    "interviewApplicationId"
                ).value;

            const scheduledAt =
                document.getElementById(
                    "interviewDateTime"
                ).value;

            const interviewType =
                document.getElementById(
                    "interviewType"
                ).value;

            const meetingLink =
                document.getElementById(
                    "meetingLink"
                ).value;

            const venue =
                document.getElementById(
                    "interviewVenue"
                ).value;

            const message =
                document.getElementById(
                    "interviewMessage"
                );

            const token =
                sessionStorage.getItem(
                    "access_token"
                );


            if (!token) {

                message.textContent =
                    "Please login first.";

                return;
            }


            message.textContent =
                "Scheduling interview...";


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/interviews/`,
                        {
                            method: "POST",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`,

                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                application_id:
                                    Number(
                                        applicationId
                                    ),

                                scheduled_at:
                                    scheduledAt,

                                interview_type:
                                    interviewType,

                                meeting_link:
                                    meetingLink || null,

                                venue:
                                    venue || null
                            })
                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "Interview response:",
                    data
                );


                if (!response.ok) {

                    message.textContent =
                        data.detail ||
                        "Unable to schedule interview.";

                    return;
                }


                message.textContent =
                    "Interview scheduled successfully!";


                interviewForm.reset();


                loadRecruiterInterviews();

            }


            catch (error) {

                console.error(
                    "Interview scheduling error:",
                    error
                );

                message.textContent =
                    "Unable to connect to the server.";

            }

        }
    );

}


// -----------------------------------------------------
// LOAD RECRUITER INTERVIEWS
// -----------------------------------------------------

async function loadRecruiterInterviews() {

    const container =
        document.getElementById(
            "recruiterInterviewsContainer"
        );


    if (!container) {
        return;
    }


    const token =
        sessionStorage.getItem(
            "access_token"
        );


    if (!token) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/interviews/recruiter`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const interviews =
            await response.json();


        console.log(
            "Recruiter interviews:",
            interviews
        );


        if (!response.ok) {

            container.innerHTML =
                `<p>
                    Unable to load interviews.
                </p>`;

            return;
        }


        if (
            !interviews ||
            interviews.length === 0
        ) {

            container.innerHTML =
                `<p>
                    No interviews scheduled yet.
                </p>`;

            return;
        }


        container.innerHTML = "";


        interviews.forEach(
            interview => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "application-card";


                card.innerHTML = `

                    <h3>
                        Interview #${interview.id}
                    </h3>

                    <p>
                        <strong>
                            Application ID:
                        </strong>

                        ${interview.application_id}
                    </p>

                    <p>
                        <strong>
                            Date & Time:
                        </strong>

                        ${interview.scheduled_at}
                    </p>

                    <p>
                        <strong>
                            Type:
                        </strong>

                        ${interview.interview_type}
                    </p>

                    <p>
                        <strong>
                            Status:
                        </strong>

                        ${interview.status}
                    </p>

                    ${
                        interview.meeting_link
                        ?
                        `<p>
                            <strong>
                                Meeting Link:
                            </strong>

                            <a
                                href="${interview.meeting_link}"
                                target="_blank"
                            >
                                Join Interview
                            </a>
                        </p>`
                        :
                        ""
                    }

                    ${
                        interview.venue
                        ?
                        `<p>
                            <strong>
                                Venue:
                            </strong>

                            ${interview.venue}
                        </p>`
                        :
                        ""
                    }

                `;


                container.appendChild(
                    card
                );

            }
        );

    }


    catch (error) {

        console.error(
            "Interview loading error:",
            error
        );

        container.innerHTML =
            `<p>
                Unable to connect to server.
            </p>`;

    }

}


// -----------------------------------------------------
// LOAD INTERVIEWS WHEN RECRUITER DASHBOARD OPENS
// -----------------------------------------------------

if (
    document.getElementById(
        "recruiterInterviewsContainer"
    )
) {

    loadRecruiterInterviews();

}

// =====================================================
// SAVED JOBS
// =====================================================

async function toggleSavedJob(jobId) {

    const token =
        sessionStorage.getItem("access_token");

    if (!token) {

        window.location.href =
            "login.html";

        return;
    }

    try {

        // Check whether job is already saved

        const savedResponse =
            await fetch(
                `${API_URL}/api/jobs/saved`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const savedJobs =
            await savedResponse.json();

        const alreadySaved =
            Array.isArray(savedJobs) &&
            savedJobs.some(
                job => job.id === jobId
            );


        // Save or remove

        const response =
            await fetch(
                `${API_URL}/api/jobs/${jobId}/save`,
                {
                    method:
                        alreadySaved
                            ? "DELETE"
                            : "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to update saved jobs."
            );

            return;
        }


        alert(
            data.message ||
            "Saved jobs updated."
        );


        loadSavedJobs();

    }

    catch (error) {

        console.error(
            "Saved job error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}


// =====================================================
// LOAD SAVED JOBS
// =====================================================

async function loadSavedJobs() {

    const container =
        document.getElementById(
            "savedJobsContainer"
        );

    if (!container) {
        return;
    }


    const token =
        sessionStorage.getItem(
            "access_token"
        );

    if (!token) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/jobs/saved`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const jobs =
            await response.json();


        if (!response.ok) {

            container.innerHTML =
                `<p>
                    ${jobs.detail ||
                    "Unable to load saved jobs."}
                </p>`;

            return;
        }


        if (!jobs.length) {

            container.innerHTML =
                "<p>No saved jobs yet.</p>";

            return;
        }


        container.innerHTML = "";


        jobs.forEach(job => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "job-card";


            card.innerHTML = `

                <h3>
                    ${job.title}
                </h3>

                <p>
                    <strong>Location:</strong>
                    ${job.location || "N/A"}
                </p>

                <p>
                    <strong>Experience:</strong>
                    ${job.experience_level || "N/A"}
                </p>

                <p>
                    <strong>Skills:</strong>
                    ${job.skills || "N/A"}
                </p>

                <div class="job-actions">

                    <button
                        class="apply-button"
                        onclick="applyForJob(${job.id})"
                    >
                        Apply Now
                    </button>

                    <button
                        class="danger-button"
                        onclick="toggleSavedJob(${job.id})"
                    >
                        Remove
                    </button>

                </div>
            `;


            container.appendChild(card);

        });

    }

    catch (error) {

        console.error(
            "Saved jobs loading error:",
            error
        );

        container.innerHTML =
            "<p>Unable to connect to server.</p>";
    }
}


if (
    document.getElementById(
        "savedJobsContainer"
    )
) {

    loadSavedJobs();

}

// =====================================================
// RECRUITER JOB EDIT / CLOSE
// =====================================================

async function editRecruiterJob(jobId) {

    const token =
        sessionStorage.getItem(
            "access_token"
        );

    if (!token) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/jobs/my-jobs`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const jobs =
            await response.json();


        const job =
            jobs.find(
                item => item.id === jobId
            );


        if (!response.ok || !job) {

            alert(
                "Unable to find this job."
            );

            return;
        }


        editingJobId =
            jobId;


        document.getElementById(
            "jobTitle"
        ).value =
            job.title || "";


        document.getElementById(
            "jobDescription"
        ).value =
            job.description || "";


        document.getElementById(
            "jobSkills"
        ).value =
            job.skills || "";


        document.getElementById(
            "experienceLevel"
        ).value =
            job.experience_level || "";


        document.getElementById(
            "employmentType"
        ).value =
            job.employment_type || "";


        document.getElementById(
            "jobLocation"
        ).value =
            job.location || "";


        document.getElementById(
            "isRemote"
        ).checked =
            !!job.is_remote;


        document.getElementById(
            "salaryMin"
        ).value =
            job.salary_min ?? "";


        document.getElementById(
            "salaryMax"
        ).value =
            job.salary_max ?? "";


        document.getElementById(
            "openings"
        ).value =
            job.openings || 1;


        document.getElementById(
            "applicationDeadline"
        ).value =
            job.application_deadline
                ? job.application_deadline.slice(
                    0,
                    10
                )
                : "";


        const submitButton =
            document.getElementById(
                "jobSubmitButton"
            );

        const cancelButton =
            document.getElementById(
                "cancelEditButton"
            );


        if (submitButton) {

            submitButton.textContent =
                "Update Job";
        }


        if (cancelButton) {

            cancelButton.style.display =
                "inline-block";
        }


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });


        document.getElementById(
            "jobMessage"
        ).textContent =
            `Editing Job #${jobId}`;

    }

    catch (error) {

        console.error(
            "Edit job error:",
            error
        );

        alert(
            "Unable to load job details."
        );
    }
}


// =====================================================
// CLOSE RECRUITER JOB
// =====================================================

async function closeRecruiterJob(jobId) {

    const confirmed =
        confirm(
            "Close this job? Candidates will no longer be able to apply."
        );

    if (!confirmed) {
        return;
    }


    const token =
        sessionStorage.getItem(
            "access_token"
        );


    try {

        const response =
            await fetch(
                `${API_URL}/api/jobs/${jobId}/close`,
                {
                    method: "PUT",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Unable to close job."
            );

            return;
        }


        alert(
            "Job closed successfully."
        );


        loadRecruiterJobs();

    }

    catch (error) {

        console.error(
            "Close job error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}

// =====================================================
// CANDIDATE INTERVIEWS
// =====================================================

async function loadCandidateInterviews() {

    const container =
        document.getElementById(
            "candidateInterviewsContainer"
        );

    const countElement =
        document.getElementById(
            "interviewCount"
        );


    if (!container && !countElement) {
        return;
    }


    const token =
        sessionStorage.getItem(
            "access_token"
        );

    if (!token) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/interviews/my`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const interviews =
            await response.json();


        if (!response.ok) {
            return;
        }


        if (countElement) {

            countElement.textContent =
                interviews.length;
        }


        if (!container) {
            return;
        }


        if (!interviews.length) {

            container.innerHTML =
                "<p>No interviews scheduled yet.</p>";

            return;
        }


        container.innerHTML = "";


        interviews.forEach(
            interview => {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "interview-card";


                card.innerHTML = `

                    <h3>
                        Interview #${interview.id}
                    </h3>

                    <p>
                        <strong>
                            Application ID:
                        </strong>
                        ${interview.application_id}
                    </p>

                    <p>
                        <strong>
                            Date & Time:
                        </strong>
                        ${interview.scheduled_at}
                    </p>

                    <p>
                        <strong>
                            Type:
                        </strong>
                        ${interview.interview_type}
                    </p>

                    <p>
                        <strong>
                            Status:
                        </strong>
                        ${interview.status}
                    </p>

                    ${
                        interview.meeting_link

                        ? `
                            <p>
                                <a
                                    href="${interview.meeting_link}"
                                    target="_blank"
                                >
                                    Join Interview
                                </a>
                            </p>
                        `

                        : ""
                    }

                    ${
                        interview.venue

                        ? `
                            <p>
                                <strong>
                                    Venue:
                                </strong>
                                ${interview.venue}
                            </p>
                        `

                        : ""
                    }

                `;


                container.appendChild(
                    card
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Candidate interviews error:",
            error
        );
    }
}


if (
    document.getElementById(
        "interviewCount"
    ) ||
    document.getElementById(
        "candidateInterviewsContainer"
    )
) {

    loadCandidateInterviews();

}

// =====================================================
// CANDIDATE PROFILE
// =====================================================

const candidateProfileForm =
    document.getElementById(
        "candidateProfileForm"
    );

const resumeForm =
    document.getElementById(
        "resumeForm"
    );


async function checkCandidateAccess() {

    const token =
        sessionStorage.getItem(
            "access_token"
        );


    if (!token) {

        window.location.href =
            "login.html";

        return false;
    }


    const response =
        await fetch(
            `${API_URL}/api/auth/me`,
            {
                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


    const user =
        await response.json();


    if (
        !response.ok ||
        user.role !== "candidate"
    ) {

        alert(
            "Only candidates can access this page."
        );

        window.location.href =
            "dashboard.html";

        return false;
    }


    return true;
}


// =====================================================
// LOAD PROFILE
// =====================================================

async function loadCandidateProfile() {

    if (!candidateProfileForm) {
        return;
    }


    if (
        !(await checkCandidateAccess())
    ) {
        return;
    }


    const token =
        sessionStorage.getItem(
            "access_token"
        );


    try {

        const response =
            await fetch(
                `${API_URL}/api/candidates/profile`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const profile =
            await response.json();


        if (response.status === 404) {

            document.getElementById(
                "profileMessage"
            ).textContent =
                "Create your professional profile below.";

            candidateProfileForm.dataset.exists =
                "false";

            return;
        }


        if (!response.ok) {

            document.getElementById(
                "profileMessage"
            ).textContent =
                profile.detail ||
                "Unable to load profile.";

            return;
        }


        candidateProfileForm.dataset.exists =
            "true";


        document.getElementById(
            "profilePhone"
        ).value =
            profile.phone || "";


        document.getElementById(
            "profileEducation"
        ).value =
            profile.education || "";


        document.getElementById(
            "profileSkills"
        ).value =
            profile.skills || "";


        document.getElementById(
            "profileExperience"
        ).value =
            profile.experience || "";


        document.getElementById(
            "profileCertifications"
        ).value =
            profile.certifications || "";


        document.getElementById(
            "profileLinkedin"
        ).value =
            profile.linkedin_url || "";


        document.getElementById(
            "profilePortfolio"
        ).value =
            profile.portfolio_url || "";


        if (profile.resume_url) {

            document.getElementById(
                "currentResume"
            ).innerHTML = `

                <a
                    href="${API_URL}${profile.resume_url}"
                    target="_blank"
                >
                    View Current Resume
                </a>

            `;
        }


        document.getElementById(
            "profileMessage"
        ).textContent =
            "Profile loaded successfully.";

    }

    catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

        document.getElementById(
            "profileMessage"
        ).textContent =
            "Unable to connect to server.";
    }
}


// =====================================================
// SAVE PROFILE
// =====================================================

if (candidateProfileForm) {

    candidateProfileForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const token =
                sessionStorage.getItem(
                    "access_token"
                );


            const exists =
                candidateProfileForm.dataset.exists ===
                "true";


            const profileData = {

                phone:
                    document.getElementById(
                        "profilePhone"
                    ).value,

                education:
                    document.getElementById(
                        "profileEducation"
                    ).value,

                skills:
                    document.getElementById(
                        "profileSkills"
                    ).value,

                experience:
                    document.getElementById(
                        "profileExperience"
                    ).value,

                certifications:
                    document.getElementById(
                        "profileCertifications"
                    ).value,

                linkedin_url:
                    document.getElementById(
                        "profileLinkedin"
                    ).value,

                portfolio_url:
                    document.getElementById(
                        "profilePortfolio"
                    ).value
            };


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/candidates/profile`,
                        {
                            method:
                                exists
                                    ? "PUT"
                                    : "POST",

                            headers: {

                                "Authorization":
                                    `Bearer ${token}`,

                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    profileData
                                )
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    document.getElementById(
                        "profileMessage"
                    ).textContent =
                        data.detail ||
                        "Unable to save profile.";

                    return;
                }


                candidateProfileForm.dataset.exists =
                    "true";


                document.getElementById(
                    "profileMessage"
                ).textContent =
                    "Profile saved successfully!";

            }

            catch (error) {

                console.error(
                    "Profile save error:",
                    error
                );

                document.getElementById(
                    "profileMessage"
                ).textContent =
                    "Unable to connect to server.";
            }
        }
    );


    loadCandidateProfile();
}

if (resumeForm) {

    resumeForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const token =
                sessionStorage.getItem(
                    "access_token"
                );


            const fileInput =
                document.getElementById(
                    "resumeFile"
                );


            const file =
                fileInput.files[0];


            if (!file) {
                return;
            }


            const formData =
                new FormData();


            formData.append(
                "resume",
                file
            );


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/candidates/resume`,
                        {
                            method: "POST",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: formData
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    document.getElementById(
                        "resumeMessage"
                    ).textContent =
                        data.detail ||
                        "Resume upload failed.";

                    return;
                }


                document.getElementById(
                    "currentResume"
                ).innerHTML = `

                    <a
                        href="${API_URL}${data.resume_url}"
                        target="_blank"
                    >
                        View Uploaded Resume
                    </a>

                `;


                document.getElementById(
                    "resumeMessage"
                ).textContent =
                    "Resume uploaded successfully!";


                resumeForm.reset();

            }

            catch (error) {

                console.error(
                    "Resume upload error:",
                    error
                );

                document.getElementById(
                    "resumeMessage"
                ).textContent =
                    "Unable to connect to server.";
            }

        }
    );

}