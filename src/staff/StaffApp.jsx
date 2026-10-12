import { Navigate, Route, Routes } from "react-router";

import { StaffSessionProvider } from "./session.jsx";
import StaffLayout from "./StaffLayout.jsx";
import LoginPage from "./LoginPage.jsx";
import SetPasswordPage from "./SetPasswordPage.jsx";
import PrescriptionsList from "./PrescriptionsList.jsx";
import PrescriptionDetail from "./PrescriptionDetail.jsx";
import EnquiriesList from "./EnquiriesList.jsx";
import SignupsList from "./SignupsList.jsx";
import ProductsList from "./ProductsList.jsx";
import ProductEditor from "./ProductEditor.jsx";
import "./staff.css";

// Everything under /staff. This whole folder is loaded only when someone
// visits the dashboard, so customers never download it.
//
// Links inside the dashboard always use full paths ("/staff/products"),
// because relative ones resolve unpredictably under a nested <Routes>.
export default function StaffApp() {
  return (
    <StaffSessionProvider>
      {/* Keep the dashboard out of search results */}
      <meta name="robots" content="noindex, nofollow" />
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route path="set-password" element={<SetPasswordPage />} />
        <Route element={<StaffLayout />}>
          <Route index element={<Navigate to="/staff/prescriptions" replace />} />
          <Route path="prescriptions" element={<PrescriptionsList />} />
          <Route path="prescriptions/:id" element={<PrescriptionDetail />} />
          <Route path="enquiries" element={<EnquiriesList />} />
          <Route path="signups" element={<SignupsList />} />
          <Route path="products" element={<ProductsList />} />
          <Route path="products/new" element={<ProductEditor />} />
          <Route path="products/:id" element={<ProductEditor />} />
          <Route path="*" element={<Navigate to="/staff/prescriptions" replace />} />
        </Route>
      </Routes>
    </StaffSessionProvider>
  );
}
