import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe, getOrCreateCustomer, createCheckoutSession } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const { priceId } = await req.json();

    // 这里需要获取用户的 email 和 name
    // 实际项目中应该从 Clerk 获取用户信息
    const customer = await getOrCreateCustomer({
      email: "user@example.com", // 从 Clerk 获取
      name: "User Name", // 从 Clerk 获取
      userId,
    });

    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "创建支付会话失败" },
      { status: 500 }
    );
  }
}
