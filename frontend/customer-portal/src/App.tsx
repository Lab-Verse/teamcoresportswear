import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  hydrate,
} from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { AccountLayout } from "@/components/layout/AccountLayout";
import Information, {
  informationPaths,
  NotFoundPage,
  FAQPage,
} from "@/pages/InformationPage";
const Home = lazy(() => import("@/pages/HomePage"));
const Products = lazy(() => import("@/pages/ProductListingPage"));
const Product = lazy(() => import("@/pages/ProductDetailPage"));
const Categories = lazy(() => import("@/pages/CategoriesPage"));
const Contact = lazy(() => import("@/pages/ContactPage"));
const Studio = lazy(() => import("@/features/design/Studio"));
const Designs = lazy(() => import("@/features/design/Designs"));
const Basket = lazy(() => import("@/pages/BasketPage"));
const Quote = lazy(() => import("@/pages/QuoteRequestPage"));
const QuoteSuccess = lazy(() =>
  import("@/pages/QuoteRequestPage").then((m) => ({
    default: m.QuoteSuccessPage,
  })),
);
const Checkout = lazy(() => import("@/pages/CheckoutPage"));
const CheckoutReturn = lazy(() =>
  import("@/pages/CheckoutPage").then((m) => ({
    default: m.CheckoutReturnPage,
  })),
);
const Login = lazy(() => import("@/pages/auth/LoginPage"));
const Register = lazy(() => import("@/pages/auth/RegisterPage"));
const Forgot = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const Reset = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const Verify = lazy(() => import("@/pages/auth/VerifyEmailPage"));
const Overview = lazy(() => import("@/pages/account/OverviewPage"));
const Profile = lazy(() => import("@/pages/account/ProfilePage"));
const Orders = lazy(() => import("@/pages/account/OrdersPage"));
const OrderDetail = lazy(() => import("@/pages/account/OrderDetailPage"));
const Addresses = lazy(() => import("@/pages/account/AddressesPage"));
const Wishlist = lazy(() => import("@/pages/account/WishlistPage"));
const Notifications = lazy(() => import("@/pages/account/NotificationsPage"));
const Reviews = lazy(() => import("@/pages/account/ReviewsPage"));
const Returns = lazy(() => import("@/pages/account/ReturnsPage"));
const Settings = lazy(() => import("@/pages/account/SettingsPage"));
const Chat = lazy(() => import("@/pages/account/ChatPage"));
const Wholesale = lazy(() => import("@/pages/account/WholesaleInquiriesPage"));
const client = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60000, retry: 1, refetchOnWindowFocus: false },
  },
});
const initialState = document.getElementById("teamcore-query-state")?.textContent;
if (initialState) {
  try {
    hydrate(client, JSON.parse(initialState));
  } catch {
    /* Refresh from API if the initial snapshot is unavailable. */
  }
}
function Protected({ children }: { children: React.ReactNode }) {
  const signedIn = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  return signedIn ? (
    <>{children}</>
  ) : (
    <Navigate
      to="/login"
      state={{ from: location.pathname + location.search }}
      replace
    />
  );
}
function NavigationEffects() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(
    () =>
      useAuthStore.subscribe((next, previous) => {
        if (next.user?.id !== previous.user?.id) client.clear();
      }),
    [],
  );
  return null;
}
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <HelmetProvider>
          <QueryClientProvider client={client}>
            <BrowserRouter>
              <NavigationEffects />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route element={<MainLayout />}>
                    <Route index element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/design-studio" element={<Studio />} />
                    <Route path="/products/:slug" element={<Product />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/categories/:slug" element={<Products />} />
                    <Route path="/search" element={<Products />} />
                    <Route
                      path="/brands"
                      element={<Navigate to="/products" replace />}
                    />
                    <Route
                      path="/brands/:slug"
                      element={<Navigate to="/products" replace />}
                    />
                    <Route path="/stores/:slug" element={<NotFoundPage />} />
                    <Route
                      path="/flash-sales"
                      element={<Navigate to="/products" replace />}
                    />
                    <Route path="/cart" element={<Basket />} />
                    <Route path="/quote-basket" element={<Basket quote />} />
                    <Route
                      path="/request-quote"
                      element={
                        <Protected>
                          <Quote />
                        </Protected>
                      }
                    />
                    <Route
                      path="/request-quote/success/:id"
                      element={
                        <Protected>
                          <QuoteSuccess />
                        </Protected>
                      }
                    />
                    <Route
                      path="/checkout"
                      element={
                        <Protected>
                          <Checkout />
                        </Protected>
                      }
                    />
                    <Route
                      path="/checkout/return"
                      element={
                        <Protected>
                          <CheckoutReturn />
                        </Protected>
                      }
                    />
                    <Route
                      path="/checkout/cancelled"
                      element={
                        <Protected>
                          <CheckoutReturn />
                        </Protected>
                      }
                    />
                    {informationPaths.map((path) => (
                      <Route key={path} path={path} element={<Information />} />
                    ))}
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                  <Route element={<AuthLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<Forgot />} />
                    <Route path="/reset-password" element={<Reset />} />
                    <Route path="/verify-email" element={<Verify />} />
                  </Route>
                  <Route
                    element={
                      <Protected>
                        <AccountLayout />
                      </Protected>
                    }
                  >
                    <Route path="/account" element={<Overview />} />
                    <Route path="/account/designs" element={<Designs />} />
                    <Route path="/account/designs/:id" element={<Designs />} />
                    <Route path="/account/profile" element={<Profile />} />
                    <Route path="/account/orders" element={<Orders />} />
                    <Route
                      path="/account/orders/:id"
                      element={<OrderDetail />}
                    />
                    <Route path="/account/addresses" element={<Addresses />} />
                    <Route path="/account/wishlist" element={<Wishlist />} />
                    <Route
                      path="/account/notifications"
                      element={<Notifications />}
                    />
                    <Route path="/account/reviews" element={<Reviews />} />
                    <Route path="/account/returns" element={<Returns />} />
                    <Route path="/account/settings" element={<Settings />} />
                    <Route path="/account/chat" element={<Chat />} />
                    <Route path="/account/wholesale" element={<Wholesale />} />
                    <Route
                      path="/account/wholesale/:id"
                      element={<Wholesale />}
                    />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
            <Toaster position="top-right" richColors closeButton />
          </QueryClientProvider>
        </HelmetProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
