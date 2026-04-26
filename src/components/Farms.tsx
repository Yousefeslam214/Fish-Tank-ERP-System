import { useState, useEffect } from "react";
import { User, Farm } from "../types";
import { apiGet, apiPost, apiDelete, apiPut, apiPatch } from "../api";
import { Card, CardHeader, CardTitle } from "./ui/card";
import { Icon, Trash, Pencil } from "lucide-react";
import { barn } from "@lucide/lab";

interface Props {
  user: User;
  selectedFarm: Farm | null;
}

export default function Farms({ user }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteFarmId, setDeleteFarmId] = useState<string | null>(null);
  const [editFarmId, setEditFarmId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const fetchFarms = async () => {
    try {
      const json = await apiGet<{
        success: boolean;
        data: Farm[];
      }>("/farms");

      if (json.success) {
        setFarms(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch farms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);
  const handleAddFarm = async () => {
    if (!name.trim() || !location.trim()) {
      alert("All fields are required");
      return;
    }

    try {
      setSubmitting(true);

      const json = await apiPost<{
        success: boolean;
        data: Farm;
      }>("/farms", {
        name,
        location,
      });

      if (json) {
        await fetchFarms();

        setName("");
        setLocation("");
        setShowModal(false);
      } else {
        alert("Failed to add farm");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  /* const openEditFarm = (farm: Farm) => {
    setEditFarmId(farm.id);
    setEditName(farm.name);
    setEditLocation(farm.location || "");
  };

  const handleEditFarm = async () => {
    if (!editName.trim() || !editLocation.trim()) {
      alert("All fields are required");
      return;
    }

    try {
      setSubmitting(true);

      const json = await apiPut<{
        success: boolean;
        data: Farm;
      }>(`/farms/${editFarmId}`, {
        name: editName,
        location: editLocation,
      });

      console.log("UPDATE RESPONSE:", json); // 👈 IMPORTANT

      if (json?.success) {
        await fetchFarms();

        setEditName("");
        setEditLocation("");
        setEditFarmId(null);
      } else {
        alert("Update failed");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };
*/
  // 👉 OPEN MODAL ONLY (no delete here)
  const handleDeleteFarm = (farmId: string) => {
    setDeleteFarmId(farmId);
  };

  // 👉 CONFIRM DELETE
  const confirmDeleteFarm = async () => {
    if (!deleteFarmId) return;

    try {
      const res = await apiDelete<{
        success: boolean;
        message?: string;
      }>(`/farms/${deleteFarmId}`);

      if (res?.success) {
        await fetchFarms();
        setDeleteFarmId(null);
      } else {
        // 👇 HANDLE ERROR MESSAGE FROM BACKEND
        if (
          res?.message?.includes("foreign key") ||
          res?.message?.includes("referenced")
        ) {
          alert(
            "This farm cannot be deleted because it is linked to existing records.",
          );
        } else {
          alert(res?.message || "Failed to delete farm");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while deleting the farm");
    }
  };
  return (
    <div className="p-6 bg-[#F9FAFB] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Farms</h1>
          <p className="text-sm text-gray-500">
            Welcome back, {user?.name ?? "User"}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#088395] text-white rounded-lg text-sm hover:bg-[#0A4D68] transition"
        >
          Add Farm
        </button>
      </div>

      {/* Add Farm Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[400px] shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Add New Farm</h2>

            <div className="mb-4">
              <label className="text-sm font-medium">Farm Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
                placeholder="Enter farm name"
              />
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium">Farm Location *</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
                placeholder="Enter location"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1 text-sm bg-gray-200 rounded-md"
              >
                Cancel
              </button>

              <button
                onClick={handleAddFarm}
                disabled={submitting}
                className="px-4 py-2 bg-[#088395] text-white rounded-md text-sm"
              >
                {submitting ? "Adding..." : "Add Farm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Edit MODAL */}

      {editFarmId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[400px] shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Edit Farm</h2>

            {/* Farm Name */}
            <div className="mb-4">
              <label className="text-sm font-medium">Farm Name *</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
                placeholder="Enter farm name"
              />
            </div>

            {/* Farm Location */}
            <div className="mb-4">
              <label className="text-sm font-medium">Farm Location *</label>
              <input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
                placeholder="Enter location"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditFarmId(null)}
                className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>

              {/* <button
                onClick={handleEditFarm}
                disabled={submitting}
                className="px-4 py-2 bg-[#088395] text-white rounded-md text-sm hover:bg-[#0A4D68] transition"
              >
                {submitting ? "Updating..." : "Update Farm Details"}
              </button> */}
            </div>
          </div>
        </div>
      )}

      {/* ✅ DELETE MODAL */}
      {deleteFarmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-[420px] shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Are you sure you want to delete this farm?
            </h2>

            <p className="text-gray-500 mb-6">
              This will delete this farm permanently. You cannot undo this
              action.
            </p>

            <div className="flex justify-between gap-4">
              <button
                onClick={() => setDeleteFarmId(null)}
                className="w-full border border-gray-300 rounded-lg py-2 text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                onClick={confirmDeleteFarm}
                className="w-full bg-red-600 text-white rounded-lg py-2 hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Farms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-gray-500 italic">Loading farms...</p>
        ) : (
          farms.map((farm) => (
            <Card
              key={farm.id}
              className="bg-white shadow-sm hover:shadow-md transition relative"
            >
              <div className="absolute top-1/2 right-3 -translate-y-1/2 flex gap-3">
                {/* Edit */}
                {/* <button
                  onClick={() => openEditFarm(farm)}
                  className="text-blue-500 hover:text-blue-700 transition"
                >
                  <Pencil size={20} />
                </button> */}

                {/* Delete */}
                <button
                  onClick={() => handleDeleteFarm(farm.id)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <Trash size={20} />
                </button>
              </div>
              <CardHeader className="pb-3">
                <div>
                  <CardTitle className="text-lg font-bold text-[#0A4D68]">
                    <Icon iconNode={barn} />
                    Farm Name:{" "}
                    <span style={{ color: "#DB1A1A", fontWeight: "bolder" }}>
                      {farm.name}
                    </span>
                  </CardTitle>

                  <p className="text-sm text-gray-600 mt-2">
                    <span style={{ color: "#0A4D68", fontWeight: "bolder" }}>
                      Farm Location:{" "}
                    </span>
                    <span style={{ color: "#DB1A1A", fontWeight: "bolder" }}>
                      {farm.location || "Location not provided"}
                    </span>
                  </p>

                  <p
                    className="text-[10px] text-gray-400 font-mono"
                    style={{ color: "#04b13d" }}
                  >
                    <span style={{ color: "#000000", fontWeight: "bolder" }}>
                      Farm ID:{" "}
                    </span>
                    {farm.id?.split("-")[0]}
                  </p>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
