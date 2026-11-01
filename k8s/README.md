# Kubernetes Readiness & Container Orchestration Guide
## Third Year Information Technology — Cloud Computing Laboratory (Task 10)

This directory contains the production-grade Kubernetes manifest files for orchestrating the **EcoSwap** backend service in a cloud-native cluster environment.

---

## 1. Core Kubernetes Concepts Explained

### 1.1 Pod
A **Pod** is the smallest deployable computing unit in Kubernetes. In EcoSwap, each Pod contains our containerized Node.js/Express API service along with its allocated CPU/memory constraints, network namespace (unique IP address), and mounted storage/configuration.

### 1.2 Deployment (`deployment.yaml`)
A **Deployment** provides declarative updates for Pods and ReplicaSets. It describes the desired state:
- Specifies `replicas: 2` to guarantee high availability (two instances of the EcoSwap API running simultaneously).
- Configures automated self-healing: if a container crashes or fails the HTTP health check, Kubernetes automatically terminates and replaces it.
- Configures zero-downtime rolling updates (`RollingUpdate` strategy) when new versions of the application are released.

### 1.3 Service (`service.yaml`)
Because Pods are ephemeral and their IP addresses change when recreated, a **Service** provides a stable endpoint (IP and DNS name) and built-in Layer-4 load balancer across all matching Pod replicas (`selector: app: ecoswap`).
- Configured as a `NodePort` service exposing port `30550` for local testing on Minikube / Kind clusters.

### 1.4 ConfigMap & Secrets (`configmap.yaml`, `secret.yaml`)
- **ConfigMap:** Decouples non-sensitive configuration artifacts (`NODE_ENV`, `PORT`, `AWS_REGION`) from image content.
- **Secret:** Securely injects sensitive credentials (`MONGO_URI`, `JWT_SECRET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) as environment variables without hardcoding them into source code or container images.

### 1.5 Horizontal Pod Autoscaling (HPA) & Scaling
Scaling refers to increasing or decreasing the number of active Pod replicas based on traffic load:
- **Manual Scaling:**
  ```bash
  kubectl scale deployment ecoswap-backend-deployment --replicas=5
  ```
- **Automated Scaling (HPA):**
  Kubernetes continuously queries CPU and memory metrics from the Metrics Server. If average CPU utilization exceeds a target (e.g., 70%), Kubernetes automatically scales up replicas between configured min and max limits:
  ```bash
  kubectl autoscale deployment ecoswap-backend-deployment --cpu-percent=70 --min=2 --max=8
  ```

---

## 2. Deployment Commands (For Lab Evaluation / Viva)

To deploy the EcoSwap backend on a Kubernetes cluster (e.g., Minikube, Kind, or Cloud EKS/GKE):

```bash
# 1. Apply the Configuration and Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# 2. Deploy the EcoSwap Backend (2 Replicas)
kubectl apply -f k8s/deployment.yaml

# 3. Expose via Service
kubectl apply -f k8s/service.yaml

# 4. Verify Cluster Resources
kubectl get pods -l app=ecoswap
kubectl get deployments
kubectl get services

# 5. Check Live Health Probe Status
kubectl describe pod <pod-name> | grep -A 5 -B 2 "Liveness"
```

