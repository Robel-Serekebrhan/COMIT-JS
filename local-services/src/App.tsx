import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./app/layout/AppLayout.tsx";
import { HomePage } from "./app/routes/HomePage.tsx";
import { BrowseServicesPage } from "./app/routes/BrowserServicesPage.tsx";
import { ServiceDetailPage } from "./app/routes/ServiceDetailPage.tsx";
import { LoginPage } from "./features/auth/LoginPage.tsx";
import { RegisterPage } from "./features/auth/RegisterPage.tsx";
import { DashboardPage } from "./app/routes/DashboardPage.tsx";
import { AuthProvider } from "./app/providers/AuthProvider.tsx";
import { ProtectedRoute, RoleRoute } from "./app/providers/RouteGuards.tsx";
import { CreateListingPage } from "./features/listings/CreateListingPage";
import { ProviderBookingsPage } from "./features/bookings/ProviderBookingsPage";
import { MyBookingsChooser } from "./features/bookings/MyBookingsChooser";
import { ProviderDashboard } from "./features/provider/ProviderDashboard";
import { ChatPage } from "./features/messages/ChatPage";
import { ProfilePage } from "./features/profile/ProfilePage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="browse" element={<BrowseServicesPage />} />
          <Route path="service/:id" element={<ServiceDetailPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="bookings"
            element={
              <ProtectedRoute>
                <MyBookingsChooser />
              </ProtectedRoute>
            }
          />
          <Route
            path="bookings/:bookingId/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="provider/bookings"
            element={
              <RoleRoute allow={["provider", "admin"]}>
                <ProviderBookingsPage />
              </RoleRoute>
            }
          />

          {/* Generic protected */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Role-based examples (we’ll implement real pages later) */}
          <Route
            path="provider"
            element={
              <RoleRoute allow={["provider", "admin"]}>
                <ProviderDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="provider/listings/new"
            element={
              <RoleRoute allow={["provider", "admin"]}>
                <CreateListingPage />
              </RoleRoute>
            }
          />
          <Route
            path="admin"
            element={
              <RoleRoute allow={["admin"]}>
                <div className="container">
                  <h2>Admin Console (stub)</h2>
                </div>
              </RoleRoute>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

// imports (near others)

// inside the <Routes> tree (under <Route element={<AppLayout/>}>):
/* <Route
  path="bookings/:bookingId/chat"
  element={
    <ProtectedRoute>
      <ChatPage />
    </ProtectedRoute>
  }
/> */

// add imports near others

// inside <Routes> within <AuthProvider> and under <Route element={<AppLayout/>}>:
{
  /* <Route
  path="bookings"
  element={
    <ProtectedRoute>
      <UserBookingsPage />
    </ProtectedRoute>
  }
/>

<Route
  path="provider/bookings"
  element={
    <RoleRoute allow={["provider", "admin"]}>
      <ProviderBookingsPage />
    </RoleRoute>
  }
/> */
}

// // inside <Routes> where provider/admin routes live:
// <Route
//   path="provider/listings/new"
//   element={
//     <RoleRoute allow={["provider", "admin"]}>
//       <CreateListingPage />
//     </RoleRoute>
//   }
// />
