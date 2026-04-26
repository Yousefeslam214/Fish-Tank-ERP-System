import { useState, useEffect } from "react";
import { User, Farm } from "../types";
import { apiGet, apiPost } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Warehouse } from "lucide-react";
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

  useEffect(() => {
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
        setFarms((prev) => [json.data ?? json, ...prev]);

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

      {/* Modal */}
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

      {/* Farms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-gray-500 italic">Loading farms...</p>
        ) : (
          farms.map((farm) => (
            <Card
              key={farm.id}
              className="bg-white shadow-sm hover:shadow-md transition"
            >
              <CardHeader className="pb-3">
                <div>
                  <CardTitle className="text-lg font-bold text-[#0A4D68]">
                    <Warehouse className="mr-2 inline-block h-5 w-5" />
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
                      {farm.location || "Location not provided"}{" "}
                    </span>
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    <span style={{ color: "#000000", fontWeight: "bolder" }}>
                      {" "}
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
