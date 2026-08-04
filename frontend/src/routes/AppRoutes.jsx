<<<<<<< HEAD
import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import { HomePage } from '../pages/HomePage'
import { ProductsPage } from '../pages/ProductsPage'
import { ProductDetailPage } from '../pages/ProductDetailPage'
import { CartPage } from '../pages/CartPage'
import { CheckoutPage } from '../pages/CheckoutPage'
import { OrdersPage } from '../pages/OrdersPage'
import { ProfilePage } from '../pages/ProfilePage'
import { WishlistPage } from '../pages/WishlistPage'
import { AdminPage } from '../pages/AdminPage'
import { AboutPage } from '../pages/AboutPage'
import { ContactPage } from '../pages/ContactPage'
import { OffersPage } from '../pages/OffersPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/jewelry" element={<ProductsPage />} />
        <Route path="/collections" element={<ProductsPage />} />
        <Route path="/gemstones" element={<ProductsPage />} />
        <Route path="/new-arrivals" element={<ProductsPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
      </Route>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
=======
import { Navigate, Route, Routes } from "react-router-dom";

import { MainLayout } from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";

import { HomePage } from "../pages/HomePage";
import { ProductsPage } from "../pages/ProductsPage";
import { ProductDetailPage } from "../pages/ProductDetailPage";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { OrdersPage } from "../pages/OrdersPage";
import { ProfilePage } from "../pages/ProfilePage";
import { WishlistPage } from "../pages/WishlistPage";
import { AdminPage } from "../pages/AdminPage";
import { AboutPage } from "../pages/AboutPage";
import { ContactPage } from "../pages/ContactPage";
import { OffersPage } from "../pages/OffersPage";
import { NotFoundPage } from "../pages/NotFoundPage";

import AdminRoute from "../components/AdminRoute";

export default function AppRoutes({ initialRoute }) {
  return (
    <Routes>

      {/* Customer Layout */}

      <Route path="/" element={<MainLayout />}>
        <Route
          index
          element={
            initialRoute === "/admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <HomePage />
            )
          }
        />
        <Route path="jewelry" element={<ProductsPage />} />
        <Route path="collections" element={<ProductsPage />} />
        <Route path="gemstones" element={<ProductsPage />} />
        <Route path="new-arrivals" element={<ProductsPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="wishlist" element={<WishlistPage />} />
      </Route>

      {/* Admin Layout */}

      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route
          path="/admin"
          element={<AdminPage />}
        />
      </Route>

      <Route
        path="/404"
        element={<NotFoundPage />}
      />

      <Route
        path="*"
        element={<Navigate to="/404" replace />}
      />

    </Routes>
  );
}
>>>>>>> a1085ac3f907c76d2adb17501784107a85c1a905
