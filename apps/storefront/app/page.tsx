import { ProductCard } from "@pincommerce/agency-web-ui";

export default function HomePage() {
  return (
    <main className="agency-page">
      <h1>Direction A · Discovery-first</h1>
      <ProductCard
        title="Reference Product"
        priceLabel="₹1,999"
        state="default"
      />
    </main>
  );
}
