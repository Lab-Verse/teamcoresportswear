import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/format";
import type { Order } from "@/types";
export function InvoiceButton({ order }: { order: Order }) {
  function print() {
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) return;
    popup.opener = null;
    popup.document.title =
      "Team Core Sports Wear — Order " + (order.orderNumber || order.id);
    const style = popup.document.createElement("style");
    style.textContent =
      "body{font:15px Arial,sans-serif;max-width:800px;margin:40px auto;padding:24px;color:#18181b}h1{color:#c6010b}table{width:100%;border-collapse:collapse}td,th{padding:12px;text-align:left;border-bottom:1px solid #ddd}";
    popup.document.head.append(style);
    function block(tag: string, text: string) {
      if (!popup) throw new Error("Print window closed");
      const el = popup.document.createElement(tag);
      el.textContent = text;
      popup.document.body.append(el);
      return el;
    }
    block("h1", "Team Core Sports Wear");
    block("h2", "Order summary");
    block(
      "p",
      "Order " +
        (order.orderNumber || order.id) +
        " · " +
        formatDate(order.createdAt),
    );
    block("p", "Status: " + order.status.replaceAll("_", " "));
    block(
      "p",
      [
        order.shippingLine1,
        order.shippingLine2,
        order.shippingCity,
        order.shippingState,
        order.shippingPostalCode,
        order.shippingCountry,
      ]
        .filter(Boolean)
        .join(", "),
    );
    const table = block("table", "");
    for (const cells of [
      ["Product / SKU", "Quantity", "Unit price", "Line total"],
      ...(order.items || []).map((item) => [
        item.nameSnapshot + " / " + item.skuSnapshot,
        String(item.quantity),
        formatPrice(item.unitPrice, order.currency),
        formatPrice(item.totalAmount, order.currency),
      ]),
    ]) {
      const row = popup.document.createElement("tr");
      for (const text of cells) {
        const cell = popup.document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      }
      table.append(row);
    }
    for (const [label, value] of [
      ["Subtotal", order.subtotal],
      ["Discount", -Number(order.discountAmount)],
      ["Delivery", order.shippingAmount],
      ["Tax", order.taxAmount],
      ["Total", order.totalAmount],
    ])
      block("p", label + ": " + formatPrice(Number(value), order.currency));
    block(
      "p",
      "This is an order summary. Payment confirmation is shown in your account. Contact Team Core Sports Wear if you require a tax invoice.",
    );
    popup.focus();
    popup.print();
  }
  return (
    <Button variant="outline" size="sm" onClick={print}>
      <Printer className="h-4 w-4 mr-1" />
      Print order
    </Button>
  );
}
