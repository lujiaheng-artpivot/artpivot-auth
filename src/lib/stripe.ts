import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover" as any,
});

export const getOrCreateCustomer = async ({
  email,
  name,
  userId,
}: {
  email: string;
  name: string;
  userId: string;
}) => {
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  return await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });
};

export const createCheckoutSession = async ({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) => {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    billing_address_collection: "auto",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: 7,
    },
  });
};

export const createPortalSession = async ({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) => {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
};
