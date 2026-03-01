"use client";

import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const plans = [
  {
    name: "免费版",
    price: "¥0",
    period: "/月",
    description: "适合个人体验和轻度使用",
    features: [
      "每月 100 积分",
      "720p 视频输出",
      "标准生成速度",
      "社区支持",
    ],
    cta: "免费开始",
    popular: false,
    color: "#4fbdb5",
  },
  {
    name: "专业版",
    price: "¥199",
    period: "/月",
    description: "适合专业创作者和小团队",
    features: [
      "每月 2,500 积分",
      "4K 视频输出",
      "优先生成队列",
      "API 访问权限",
      "优先技术支持",
      "团队协作功能",
    ],
    cta: "立即订阅",
    popular: true,
    color: "#e2a84b",
  },
  {
    name: "企业版",
    price: "定制",
    period: "",
    description: "适合大型团队和企业客户",
    features: [
      "无限积分",
      "8K 视频输出",
      "专属生成资源",
      "完整 API 访问",
      "24/7 专属支持",
      "定制化解决方案",
      "SLA 保障",
    ],
    cta: "联系我们",
    popular: false,
    color: "#6891d8",
  },
];

export default function Pricing() {
  const { user } = useUser();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planName: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 这里调用 Stripe Checkout API
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: planName === "专业版" 
            ? "price_1T665pBtNApJw73H9CjmdynM" 
            : "price_1T66CSBtNApJw73HmRDRUxts",
        }),
      });
      
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("订阅失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      <Navbar />
      
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ 
              fontFamily: "'Noto Serif SC', serif",
              color: '#f2efe9'
            }}>
              选择适合您的计划
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(242,239,233,0.5)' }}>
              从免费版开始，随时升级到专业版解锁更多功能
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium transition-colors ${
              billingCycle === "monthly" ? "text-white" : "text-gray-500"
            }`}>
              月付
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className="relative w-14 h-7 rounded-full transition-colors"
              style={{ background: billingCycle === "yearly" ? '#e2a84b' : '#1a1a1a' }}
            >
              <span 
                className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all"
                style={{ 
                  left: billingCycle === "yearly" ? '32px' : '4px'
                }}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${
              billingCycle === "yearly" ? "text-white" : "text-gray-500"
            }`}>
              年付
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full"
                style={{ background: 'rgba(226,168,75,0.2)', color: '#e2a84b' }}>
                省20%
              </span>
            </span>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`relative p-8 rounded-2xl transition-all hover:translate-y-[-8px] ${
                  plan.popular ? 'md:scale-105' : ''
                }`}
                style={{ 
                  background: '#151515',
                  border: `1px solid ${plan.popular ? plan.color : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: plan.popular ? `0 0 40px ${plan.color}20` : 'none'
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      background: plan.color,
                      color: '#000'
                    }}>
                    最受欢迎
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2" style={{ color: '#f2efe9' }}>
                    {plan.name}
                  </h3>
                  <p className="text-sm" style={{ color: 'rgba(242,239,233,0.5)' }}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold" style={{ color: '#f2efe9' }}>
                    {plan.price}
                  </span>
                  <span style={{ color: 'rgba(242,239,233,0.5)' }}>
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={plan.color}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm" style={{ color: 'rgba(242,239,233,0.7)' }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <SignedIn>
                  <button
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={loading || plan.name === "免费版"}
                    className="w-full py-3 px-6 rounded-lg font-medium transition-all hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      background: plan.popular 
                        ? `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)` 
                        : 'transparent',
                      border: `1px solid ${plan.color}`,
                      color: plan.popular ? '#000' : plan.color,
                    }}
                  >
                    {loading ? "处理中..." : plan.cta}
                  </button>
                </SignedIn>

                <SignedOut>
                  <Link
                    href="/sign-up"
                    className="block w-full py-3 px-6 rounded-lg font-medium text-center transition-all hover:translate-y-[-2px]"
                    style={{ 
                      background: plan.popular 
                        ? `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)` 
                        : 'transparent',
                      border: `1px solid ${plan.color}`,
                      color: plan.popular ? '#000' : plan.color,
                    }}
                  >
                    {plan.cta}
                  </Link>
                </SignedOut>
              </div>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="mt-16 text-center">
            <p className="text-sm mb-4" style={{ color: 'rgba(242,239,233,0.5)' }}>
              支持的支付方式
            </p>
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1677FF">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
                <span className="text-sm" style={{ color: '#f2efe9' }}>支付宝</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#07C160">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
                <span className="text-sm" style={{ color: '#f2efe9' }}>微信支付</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#635BFF">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
                <span className="text-sm" style={{ color: '#f2efe9' }}>Stripe</span>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8" style={{ 
              fontFamily: "'Noto Serif SC', serif",
              color: '#f2efe9'
            }}>
              常见问题
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "可以随时取消订阅吗？",
                  a: "是的，您可以随时在控制台中取消订阅。取消后，您仍可使用已付费的服务直到当前计费周期结束。"
                },
                {
                  q: "积分用不完会过期吗？",
                  a: "月付计划的积分每月重置，年付计划的积分在订阅期内有效。未使用的积分不会累积到下个月。"
                },
                {
                  q: "支持退款吗？",
                  a: "我们提供 7 天无理由退款保证。如果您对服务不满意，可以在订阅后 7 天内申请全额退款。"
                },
                {
                  q: "如何升级或降级计划？",
                  a: "您可以随时在控制台中更改订阅计划。升级立即生效，降级将在当前计费周期结束后生效。"
                }
              ].map((faq, index) => (
                <div key={index} className="p-6 rounded-xl"
                  style={{ 
                    background: '#151515',
                    border: '1px solid rgba(255,255,255,0.07)'
                  }}>
                  <h3 className="font-semibold mb-2" style={{ color: '#f2efe9' }}>
                    {faq.q}
                  </h3>
                  <p className="text-sm" style={{ color: 'rgba(242,239,233,0.5)' }}>
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
