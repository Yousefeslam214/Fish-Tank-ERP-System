# Frontend Tasks: User Management & Authorization

**Objective**: Implement a secure, role-based user management interface with dynamic navigation.

## 1. Dynamic Navigation & Access Control
**Goal**: The UI must adapt to the logged-in user's permissions.

- **Task**: **Dynamic Sidebar Component**
    - [ ] Fetch the current user's profile on login (or use the `modules` array from the login response).
    - [ ] Filter sidebar items based on the `modules` array (e.g., if "accounting" is missing, hide the Accounting menu).
    - [ ] **Cross-Check**: Use `GET /api/v1/meta` to get module labels and icons to ensure data consistency.
- **Task**: **Route Guards**
    - [ ] Implement middleware to block URL navigation to restricted modules directly.

## 2. Advanced User Registration
**Goal**: Comprehensive signup for staff.

- **Task**: **Staff Registration Form**
    - [ ] **Endpoint**: `POST /auth/signup`
    - [ ] **Request Example**:
    ```json
    {
      "email": "staff@fishfarm.com",
      "password": "SecurePassword123!",
      "firstName": "John",
      "lastName": "Doe",
      "role": "TECNICAN",
      "farmIds": ["uuid-1", "uuid-2"],
      "gender": "MALE",
      "dateOfBirth": "1990-05-15",
      "address": "123 Aqua Lane"
    }
    ```
    - [ ] **Basic Info**: Build fields for Email, Password, First/Last Name.
    - [ ] **Personal Details**: Add fields for Gender (Enum from `/meta`), Date of Birth, and Address.
    - [ ] **Role Selection**: Dropdown for roles (ADMIN, ACCOUNTANT, TECNICAN) fetched from `/meta`.
    - [ ] **Multi-Farm Picker**: A multi-select dropdown to assign one or more farms to the user (fetched from `GET /api/v1/farms`).

## 3. User Administration
**Goal**: Manage existing staff permissions.

- **Task**: **User Management Dashboard**
    - [ ] **User List**: Display all users with their roles and status (`GET /api/v1/users`).
    - [ ] **Edit Role & Farms**:
        - [ ] **Endpoint**: `PATCH /api/v1/users/:id`
        - [ ] **Request Example**:
        ```json
        {
          "role": "MANAGER",
          "farmIds": ["uuid-1", "uuid-3"]
        }
        ```
        - [ ] Allow changing the user's role.
        - [ ] Allow adding/removing farm assignments.
    - [ ] **Module Overrides**:
        - [ ] **Endpoint**: `PATCH /api/v1/users/:id/modules`
        - [ ] **Request Example (Remove Access)**:
        ```json
        {
          "moduleIds": ["inventory"],
          "action": "REMOVE"
        }
        ```
        - [ ] Provide a checklist to add/remove specific modules for a user (overriding their role defaults).

## 4. Metadata Integration
- **Task**: **Global Meta Service**
    - [ ] Centralize the call to `GET /api/v1/meta`.
    - [ ] **Response Example**:
    ```json
    {
      "enums": {
        "userRoles": [{"key": "ADMIN", "value": 1, "label": {"en": "Admin", "ar": "تحكم"}}],
        "gender": [...]
      },
      "modules": [{"id": "inventory", "label": {"en": "Inventory", "ar": "المخزون"}}]
    }
    ```
    - [ ] Provide enums and localized labels (ar/en) to all forms and tables.
- **Task**: **Identification & Display Rules**
    - [ ] **ID Rule**: For all entities displayed (Users, Farms, Modules), always show both `name` and `id`.
    - [ ] **ID Formatting**: Truncate UUIDs to show only the first segment: `id.split('-')[0]`.

## 5. Development Utilities
- **Task**: **Quick Login Presets**
    - [ ] Add 6 quick-login buttons to the Login page for faster testing.
    - [ ] Roles to include: admin, manager, technican, sales, worker, delivery.
    - [ ] **Credentials Format**: `[role].test@fishfarm360.local`.
    - [ ] **Shared Password**: `FishFarm360!2026`.

## 6. Fish Type Management
**Goal**: Manage global fish species configurations, including water quality and harvest targets.
> **Note**: Added 2 new fields: `targetWeightForHarvest` (kg) and `defaultMarketPrice` (currency/unit).
- **Task**: **Fish Type CRUD UI**
    - [ ] **List**: Display table of all fish types (`GET /farm/fish-types`).
    - [ ] **Create**: Form for adding new species (`POST /farm/fish-types`).
        - [ ] Include all required fields: Name, Scientific Name, Harvest Target Weight, Default Market Price.
        - [ ] Implement complex inputs for Feeding Rate Matrix, Meal Frequency, and Protein Requirements.
    - [ ] **Edit**: Update existing fish type (`PUT /farm/fish-types/:id`).
    - [ ] **Delete**: Archive/Delete species (`DELETE /farm/fish-types/:id`).
- **Task**: **Schema Reference**
    - **Request Example (Create)**:
    ```json
    {
      "name": "Nile Tilapia",
      "scientificName": "Oreochromis niloticus",
      "targetWeightForHarvest": 0.5,
      "defaultMarketPrice": 50,
      "tempMin": 20,
      "tempOptimal": 28,
      "tempMax": 34,
      "doMin": 3,
      "doSafe": 5,
      "phMin": 6.5,
      "phMax": 8.5,
      "nh3Safe": 0.02,
      "nh3Critical": 0.1,
      "no2Max": 0.5,
      "fcrMin": 1.1,
      "fcrMax": 1.5,
      "survivalRate": 90,
      "feedingRateMatrix": {
        "weight_ranges": [{"min": 10, "max": 15}],
        "temperatures": [23, 26, 28],
        "rates": [[2.0, 3.0, 3.5]]
      },
      "mealFrequencyRules": [{"maxWeight": 10, "mealsPerDay": 5}],
      "proteinRequirements": [{"minWeight": 0, "maxWeight": 10, "proteinPercentage": 35}]
    }
    ```
    - **Response Example**:
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid-segment",
        "name": "Nile Tilapia",
        "scientificName": "Oreochromis niloticus",
        "targetWeightForHarvest": 0.5,
        "defaultMarketPrice": 50,
        "isActive": true
      },
      "message": "Fish type created successfully"
    }
    ```