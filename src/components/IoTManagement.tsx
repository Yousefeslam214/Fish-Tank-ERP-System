import { User, Farm } from "../types";

interface Props {
  user: User;
  selectedFarm: Farm | null;
}

export default function IoTManagement({ user }: Props) {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Sensors Readings</h1>
          <p className="text-sm text-gray-500">Welcome back, {user.name}</p>
        </div>
      </div>

      {/* Top Cards (empty placeholders) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border h-24"></div>
        <div className="bg-white p-4 rounded-xl border h-24"></div>
        <div className="bg-white p-4 rounded-xl border h-24"></div>
        <div className="bg-white p-4 rounded-xl border h-24"></div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Section */}
        <div className="bg-white p-4 rounded-xl border h-64"></div>

        {/* Middle Section */}
        <div className="bg-white p-4 rounded-xl border h-64"></div>

        {/* Right Section */}
        <div className="bg-white p-4 rounded-xl border h-64"></div>
      </div>
    </div>
  );
}
