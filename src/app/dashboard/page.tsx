"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Subscription {
  status: string;
  plan: string;
  currentPeriodEnd: string;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 这里可以调用API获取用户的订阅信息
    // 暂时模拟数据
    setTimeout(() => {
      setSubscription({
        status: "active",
        plan: "专业版",
        currentPeriodEnd: "2026-03-28",
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: '#080808' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: '#e2a84b' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      <Navbar />
      
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ 
              fontFamily: "'Noto Serif SC', serif",
              color: '#f2efe9'
            }}>
              控制台
            </h1>
            <p style={{ color: 'rgba(242,239,233,0.5)' }}>
              欢迎回来，{user?.firstName || user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-2xl"
              style={{ 
                background: '#151515',
                border: '1px solid rgba(255,255,255,0.07)'
              }}>
              <div className="text-sm mb-2" style={{ color: 'rgba(242,239,233,0.5)' }}>
                剩余积分
              </div>
              <div className="text-3xl font-bold" style={{ color: '#e2a84b' }}>
                2,500
              </div>
            </div>
            
            <div className="p-6 rounded-2xl"
              style={{ 
                background: '#151515',
                border: '1px solid rgba(255,255,255,0.07)'
              }}>
              <div className="text-sm mb-2" style={{ color: 'rgba(242,239,233,0.5)' }}>
                已生成视频
              </div>
              <div className="text-3xl font-bold" style={{ color: '#4fbdb5' }}>
                128
              </div>
            </div>
            
            <div className="p-6 rounded-2xl"
              style={{ 
                background: '#151515',
                border: '1px solid rgba(255,255,255,0.07)'
              }}>
              <div className="text-sm mb-2" style={{ color: 'rgba(242,239,233,0.5)' }}>
                存储空间
              </div>
              <div className="text-3xl font-bold" style={{ color: '#6891d8' }}>
                45%
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="p-6 rounded-2xl mb-8"
            style={{ 
              background: '#151515',
              border: '1px solid rgba(255,255,255,0.07)'
            }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: '#f2efe9' }}>
                订阅状态
              </h2>
              <span className="px-3 py-1 text-sm rounded-full"
                style={{ 
                  background: 'rgba(114,188,110,0.1)',
                  color: '#72bc6e'
                }}>
                {subscription?.status === "active" ? "活跃" : "未订阅"}
              </span>
            </div>
            
            {loading ? (
              <div className="animate-pulse h-4 rounded w-1/3"
                style={{ background: 'rgba(255,255,255,0.1)' }}></div>
            ) : subscription ? (
              <div>
                <p className="mb-2" style={{ color: 'rgba(242,239,233,0.7)' }}>
                  当前计划：<span className="font-medium" style={{ color: '#f2efe9' }}>
                    {subscription.plan}
                  </span>
                </p>
                <p className="mb-4" style={{ color: 'rgba(242,239,233,0.5)' }}>
                  下次续费日期：{subscription.currentPeriodEnd}
                </p>
                <Link 
                  href="/pricing"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all hover:translate-y-[-2px]"
                  style={{ 
                    background: 'linear-gradient(135deg, #e2a84b, #d4953f)',
                    color: '#000'
                  }}
                >
                  管理订阅
                </Link>
              </div>
            ) : (
              <div>
                <p className="mb-4" style={{ color: 'rgba(242,239,233,0.5)' }}>
                  您当前没有活跃的订阅
                </p>
                <Link 
                  href="/pricing"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all hover:translate-y-[-2px]"
                  style={{ 
                    background: 'linear-gradient(135deg, #e2a84b, #d4953f)',
                    color: '#000'
                  }}
                >
                  查看定价
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="#"
              className="p-6 rounded-2xl transition-all hover:translate-y-[-4px] group"
              style={{ 
                background: '#151515',
                border: '1px solid rgba(255,255,255,0.07)'
              }}>
              <div className="text-lg font-semibold mb-2 group-hover:text-[#e2a84b] transition-colors"
                style={{ color: '#f2efe9' }}>
                开始创作
              </div>
              <p style={{ color: 'rgba(242,239,233,0.5)' }}>
                使用 AI 生成您的下一个影像作品
              </p>
            </Link>
            
            <Link href="#"
              className="p-6 rounded-2xl transition-all hover:translate-y-[-4px] group"
              style={{ 
                background: '#151515',
                border: '1px solid rgba(255,255,255,0.07)'
              }}>
              <div className="text-lg font-semibold mb-2 group-hover:text-[#4fbdb5] transition-colors"
                style={{ color: '#f2efe9' }}>
                查看作品
              </div>
              <p style={{ color: 'rgba(242,239,233,0.5)' }}>
                管理您已生成的所有视频
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
