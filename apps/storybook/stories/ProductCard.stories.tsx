import type { Meta, StoryObj } from "@storybook/react";
import { ProductCard } from "@pincommerce/agency-web-ui";

const meta = {
  title: "Commerce/ProductCard",
  component: ProductCard,
  args: {
    title: "Reference Product",
    priceLabel: "₹1,999",
  },
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Loading: Story = { args: { state: "loading" } };
export const Failure: Story = { args: { state: "failure" } };
export const PaymentFailed: Story = { args: { state: "payment-failed" } };
