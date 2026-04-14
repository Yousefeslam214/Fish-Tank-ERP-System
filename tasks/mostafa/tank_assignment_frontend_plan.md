# Frontend Plan: Tank Assignment System

This plan outlines the integration of user-to-tank assignments in the frontend, following the existing backend API structure.

## 1. API Integration Layer
Create or update the API service to include the following methods:

| Action | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Assign User** | `POST` | `/api/v1/tanks/:tankId/assign/:userId` | Links a staff member to a tank. |
| **Unassign User** | `DELETE` | `/api/v1/tanks/:tankId/unassign/:userId` | Removes staff from a tank. |
| **Get Assigned Users** | `GET` | `/api/v1/tanks/:tankId/users` | Fetches a list of IDs for currently assigned staff. |
| **Get Farm Users** | `GET` | `/api/v1/users/farm/:farmId` | Fetches all users and their roles in a specific farm. |

## 2. UI Components & Logic

### Tank User Card / Modal
Add an "Assigned Staff" section to the **Tank Management** or **Tank Details** view.

#### Features:
1.  **Staff List**: Display chips or icons for currently assigned users.
2.  **Add Staff Dropdown**: 
    - Fetch all available users (e.g., `GET /api/v1/users`).
    - Filter out users already assigned to the tank.
    - On selection, call the `ASSIGN` endpoint.
3.  **Removal Action**:
    - Provide a "Delete" or "X" icon on the user chip.
    - On click, call the `UNASSIGN` endpoint.

### State Management
- Use a local state `assignedUserIds` in the Tank component.
- **On Component Mount**: Fetch assigned users using `GET /api/v1/tanks/:id/users`.
- **Optimistic UI**: Update the local list immediately upon assign/unassign, then revert if the API call fails to keep the UI snappy.

## 3. Implementation Workflow

1.  **Define API Service**: Update `tankService.ts` or equivalent with the new routes.
2.  **User Picker Component**: Create a reusable searchable dropdown for selecting staff members.
3.  **Integration**:
    - Open `TankManagement.tsx` (or the relevant detail view).
    - Add the **Staff Assignment** section in the tank details panel.
    - Wire up the event handlers to the API service.

---

### Endpoints Reference for Frontend Devs:
```bash
# Assign
POST /api/v1/tanks/{{tankId}}/assign/{{userId}}

# Unassign
DELETE /api/v1/tanks/{{tankId}}/unassign/{{userId}}

# List
GET /api/v1/tanks/{{tankId}}/users
```
