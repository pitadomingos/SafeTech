# ZeroGate CARS Manager — Azure Enterprise Production Deployment Playbook

This guide details the end-to-end deployment architecture and setup steps required to host the ZeroGate CARS Manager application on Microsoft Azure.

---

## 1. Deployment Architecture

The ZeroGate CARS Manager system consists of three main tiers:
1. **Frontend (UI Tier)**: React application built with TypeScript and Vite, hosted on **Azure Static Web Apps (SWA)**.
2. **Backend (API Tier)**: Express/Node.js synchronization service, hosted on **Azure App Service** (Linux/Node.js runtime).
3. **Database (Data Tier)**: PostgreSQL relational database, hosted on **Azure Database for PostgreSQL Flexible Server**.

```mermaid
graph TD
    Client[Client Browser] -->|HTTPS / WSS| SWA[Azure Static Web Apps]
    Client -->|API Requests| AppSvc[Azure App Service Node.js]
    AppSvc -->|Secured Connection / VNet| Postgre[Azure Database for PostgreSQL]
    
    GitHub[GitHub Repo] -->|GitHub Actions CI/CD| SWA
    GitHub -->|GitHub Actions CI/CD| AppSvc
```

---

## 2. Prerequisites
- An active **Azure Subscription** with permissions to create resource groups and service principals.
- **Azure CLI** installed locally (`az` tool).
- Node.js v18+ environment.
- Access to the application's GitHub repository.

---

## 3. Step 1: Database Setup (Azure Database for PostgreSQL)

For production durability, we use Azure Database for PostgreSQL Flexible Server.

### Provisioning via Azure CLI:
```bash
# 1. Create a Resource Group
az group create --name rg-zerogate-prod --location eastus

# 2. Create the Flexible Server
az postgres flexible-server create \
  --resource-group rg-zerogate-prod \
  --name db-zerogate-prod \
  --location eastus \
  --admin-user zadmin \
  --admin-password "change-to-a-very-secure-password-123!" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --public-access 0.0.0.0 \
  --storage-size 32 \
  --version 15
```
> [!IMPORTANT]
> Make sure to configure the **Azure Firewall rules** on the flexible database server to allow connections from Azure Services (this lets App Service communicate with the DB).

---

## 4. Step 2: Backend Setup (Azure App Service)

The synchronization API tier is hosted on a Node.js Linux App Service.

### Provisioning via Azure CLI:
```bash
# 1. Create App Service Plan (B1 basic plan for lightweight sync service)
az appservice plan create \
  --name plan-zerogate-prod \
  --resource-group rg-zerogate-prod \
  --location eastus \
  --sku B1 \
  --is-linux

# 2. Create Node.js Web App
az webapp create \
  --resource-group rg-zerogate-prod \
  --plan plan-zerogate-prod \
  --name app-zerogate-api-prod \
  --runtime "NODE:18-lts"
```

### Configuring Environment Variables:
Navigate to **Settings > Configuration** in the Azure Portal for the Web App and add the following Application Settings:

| Name | Value (Example) | Description |
|---|---|---|
| `PORT` | `8080` | Server listening port |
| `NODE_ENV` | `production` | Run environment |
| `DATABASE_URL` | `postgresql://zadmin:password@db-zerogate-prod.postgres.database.azure.com:5432/postgres?sslmode=require` | Connection URI |
| `JWT_SECRET` | `super-secret-token-key-change-me` | Secret for user sessions |

---

## 5. Step 3: Frontend Setup (Azure Static Web Apps)

Azure Static Web Apps integrates natively with GitHub for automatic compilation and hosting of static assets.

### Provisioning SWA:
1. Log in to the [Azure Portal](https://portal.azure.com/).
2. Click **Create a resource** and search for **Static Web App**.
3. Select Resource Group `rg-zerogate-prod` and name the SWA `swa-zerogate-prod`.
4. Choose **GitHub** as the deployment source and authorize Azure.
5. Select your organization, repository, and branch (`main`).
6. Set the Build Presets to **Vite**:
   - **App location**: `/`
   - **Api location**: (Leave empty as we use a standalone App Service)
   - **Output location**: `dist`
7. Click **Review + Create**.

Azure will commit a GitHub Actions workflow file to your repository which automates compilation and deployment.

---

## 6. GitHub Actions CI/CD Pipeline Configuration

### A. Frontend deployment workflow (`.github/workflows/azure-swa.yml`):
```yaml
name: Deploy ZeroGate Frontend to Azure SWA

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_action != 'closed'
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
          
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          output_location: "dist"
```

### B. Backend deployment workflow (`.github/workflows/azure-appservice.yml`):
```yaml
name: Deploy ZeroGate API to Azure App Service

on:
  push:
    branches:
      - main
    paths:
      - 'server/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'server/package-lock.json'

      - name: Install dependencies and build
        run: |
          cd server
          npm ci
          npm run build --if-present

      - name: Zip API Files
        run: zip -r release.zip server/

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'app-zerogate-api-prod'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: release.zip
```

---

## 7. Verification and Go-Live Checklist

- [ ] **SSL Certificates**: Verify that HTTPS is active on both the Static Web App and App Service (Azure issues automated free SSL certs for custom domains).
- [ ] **CORS Settings**: In the Azure Portal for the App Service, go to **API > CORS** and add the URL of your Static Web App to prevent Cross-Origin resource request failures.
- [ ] **Backup Policy**: Ensure automatic backups are configured for the PostgreSQL database under the "Backup" settings tab.
- [ ] **Diagnostics Logging**: Enable "App Service logs" inside your Node container and hook them to Azure Log Analytics for real-time error auditing.
