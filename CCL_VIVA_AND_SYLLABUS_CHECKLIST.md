# SEMESTER 5 CLOUD COMPUTING LABORATORY (CCL)
## EcoSwap Assessment Checklist & Viva Preparation Guide

---

## 1. Syllabus Task Mapping & Completion Status

| Syllabus Task | Focus Area | Status | Where Demonstrated |
| :--- | :--- | :---: | :--- |
| **Task 1: Hosted Virtualization** | Type-2 Hypervisor (VirtualBox / KVM) | **External Practical** | Demonstrated in lab PC by booting Ubuntu VM inside Oracle VirtualBox. |
| **Task 2: Bare-metal Virtualization** | Type-1 Hypervisor (ESXi / Hyper-V) | **External Practical** | Demonstrated via VMware ESXi / Hyper-V installed directly on hardware. |
| **Task 3: Infrastructure as a Service (IaaS)** | Cloud Compute & Virtual Storage | **COMPLETED** | EcoSwap AWS S3 bucket infrastructure, IAM policies, and cloud networking. |
| **Task 4: Platform as a Service (PaaS)** | Automated Build & App Hosting | **COMPLETED** | Backend on Render with health checks; Frontend on Vercel with automated CI/CD. |
| **Task 5: Security as a Service (SECaaS)** | Audit Trail & Cryptographic Security | **COMPLETED** | Security audit logging, 90-day TTL indexes, bcrypt password hashing, and JWT tokens. |
| **Task 6: Identity and Access Management (IAM)** | RBAC, Policies & Programmatic Keys | **COMPLETED** | Role matrix (`user`, `admin`, `auditor`), ownership verification, SaaS `X-API-KEY`. |
| **Task 7: Storage as a Service (STaaS)** | Cloud Object Storage | **COMPLETED** | Amazon S3 integration via AWS SDK v3, multipart memory upload, and deletion cleanup. |
| **Task 8: Database as a Service (DBaaS)** | Cloud Managed Databases | **COMPLETED** | MongoDB Atlas cloud cluster connection string with automated in-memory fallback. |
| **Task 9: Containerisation** | Docker Container Build & Execution | **COMPLETED** | Production `Dockerfile` (`node:20-alpine`), non-root user (`node`), `docker-compose.yml`. |
| **Task 10: Container Orchestration** | Kubernetes High Availability & Scaling | **COMPLETED** | Kubernetes `deployment.yaml` (2 replicas), `service.yaml`, `configmap.yaml`, `secret.yaml`. |

---

## 2. Common Viva Questions & Model Answers

### Q1: What is the difference between IaaS, PaaS, SaaS, STaaS, and DBaaS in EcoSwap?
* **IaaS (Infrastructure as a Service):** Provides raw computing infrastructure such as virtual servers, networking, and storage (e.g., AWS EC2, S3 bucket storage).
* **PaaS (Platform as a Service):** Manages the operating system, runtime, server provisioning, and automated build pipelines so developers only deploy code (e.g., Render running our Node.js runtime and Vercel serving our React SPA).
* **SaaS (Software as a Service):** The end-user application delivered over the web (e.g., the EcoSwap web app itself and its programmatic API key consumption).
* **STaaS (Storage as a Service):** Managed cloud object storage for files and binary media (e.g., Amazon S3 storing product images with unique hash keys).
* **DBaaS (Database as a Service):** Fully managed, clustered, and auto-backed database system (e.g., MongoDB Atlas hosting the database replica sets).

### Q2: Why are images stored in AWS S3 instead of MongoDB?
Storing binary images inside MongoDB causes database bloat, exceeds the 16 MB BSON document limit, degrades query caching, and increases backup latency. Storing images in **Amazon S3** provides:
1. High durability (99.999999999% — 11 9s).
2. Direct content delivery and scalability.
3. Decoupled architecture where the database only holds lightweight string references (`imageUrl` and `s3Key`).

### Q3: How is IAM implemented in EcoSwap?
EcoSwap implements IAM through:
1. **Role-Based Access Control (RBAC):** Gated by `requireRole(...)` middleware for `user`, `admin`, and `auditor`.
2. **Resource Ownership Enforcement:** Only the original lister (`item.postedBy === req.user.userId`) can edit or delete an item listing.
3. **Least Privilege AWS IAM:** The backend requires only `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` permissions on the designated S3 bucket.

### Q4: How does container orchestration differ from containerisation?
* **Containerisation (Docker):** Packages the application code, runtime, system libraries, and settings into an isolated, reproducible container image.
* **Container Orchestration (Kubernetes):** Manages the lifecycle of thousands of containers across clusters of physical/virtual machines. It handles automated scheduling, horizontal pod autoscaling, rolling updates, load balancing, and self-healing when containers fail.

### Q5: How does the `/api/health` endpoint support cloud orchestration?
In cloud platforms (like Kubernetes and Render), orchestrators require health check probes:
* **Liveness Probe:** Queries `/api/health` to confirm the process is responsive. If not, it restarts the container.
* **Readiness Probe:** Checks `database.status === 'connected'`. If the database is still connecting, the orchestrator delays routing web traffic to that pod until it is ready.

