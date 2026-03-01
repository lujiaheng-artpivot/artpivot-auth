import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // 处理订阅成功
      console.log("Subscription created:", session.subscription);
      
      // 这里可以：
      // 1. 更新数据库中的用户订阅状态
      // 2. 发送确认邮件
      // 3. 激活用户的专业版功能
      
      break;
    }
    
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      
      // 处理续费成功
      console.log("Payment succeeded:", invoice.id);
      
      break;
    }
    
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      
      // 处理支付失败
      console.log("Payment failed:", invoice.id);
      
      break;
    }
    
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      
      // 处理订阅取消
      console.log("Subscription cancelled:", subscription.id);
      
      break;
    }
  }

  return NextResponse.json({ received: true });
}
