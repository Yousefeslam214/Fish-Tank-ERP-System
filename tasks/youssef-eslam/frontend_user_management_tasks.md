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
