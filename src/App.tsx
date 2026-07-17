import React, { useState } from "react";
import StudentPortal from "./components/StudentPortal";
import AdminPortal from "./components/AdminPortal";

export default function App() {
  const [portal, setPortal] = useState<"student" | "admin">("student");

  return (
    <div className="font-sans">
      {portal === "student" ? (
        <StudentPortal onGoToAdmin={() => setPortal("admin")} />
      ) : (
        <AdminPortal onGoToStudent={() => setPortal("student")} />
      )}
    </div>
  );
}
