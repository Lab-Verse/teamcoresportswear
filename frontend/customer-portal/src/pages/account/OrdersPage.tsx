import { useQuery } from "@tanstack/react-query";
import { errorMessage } from "@/services/storefront";
import { useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/common/SEOHead";
import { OrderCard } from "@/components/order/OrderCard";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { ordersApi } from "@/services/api";
import { Package } from "lucide-react";

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") ?? "1");
  const status = searchParams.get("status") ?? undefined;

  const query = useQuery({
    queryKey: ["orders", page, status],
    queryFn: () => ordersApi.list({ page, limit: 10, status }),
  });
  const orders = query.data?.data || [];
  const total = query.data?.total || 0;
  const loading = query.isPending;

  const totalPages = Math.ceil(total / 10);

  return (
    <>
      <SEOHead title="My Orders" />
      <div>
        <h1 className="text-xl font-bold text-text-primary mb-4">My Orders</h1>

        {/* Status filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            "All",
            "pending_payment",
            "pending",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled",
          ].map((s) => {
            const isActive = (s === "All" && !status) || status === s;
            return (
              <Button
                key={s}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  if (s === "All") next.delete("status");
                  else next.set("status", s);
                  next.set("page", "1");
                  setSearchParams(next);
                }}
              >
                {(s.charAt(0).toUpperCase() + s.slice(1)).replaceAll("_", " ")}
              </Button>
            );
          })}
        </div>

        {query.isError ? (
          <div role="alert" className="data-notice">
            <p>{errorMessage(query.error)}</p>
            <button onClick={() => query.refetch()}>Try again</button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Package className="h-16 w-16" />}
            title="No orders found"
            description="You haven't placed any orders yet."
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    const n = new URLSearchParams(searchParams);
                    n.set("page", String(page - 1));
                    setSearchParams(n);
                  }}
                >
                  Previous
                </Button>
                <span className="text-sm text-text-secondary self-center">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => {
                    const n = new URLSearchParams(searchParams);
                    n.set("page", String(page + 1));
                    setSearchParams(n);
                  }}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
