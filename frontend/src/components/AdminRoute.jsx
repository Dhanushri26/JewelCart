import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export default function AdminRoute({ children }) {
  const { user } = useAppContext();

  // Wait until user is loaded
  if (!user) {
    return <div>Loading...</div>;
  }

  // Only Admin can continue
  if (user.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}