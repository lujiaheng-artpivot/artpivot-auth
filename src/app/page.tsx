"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: '#080808' }}>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #e2a84b 0%, transparent 70%)' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #4fbdb5 0%, transparent 70%)' }}></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ 
              background: 'rgba(226,168,75,0.1)',
              border: '1px solid rgba(226,168,75,0.2)'
            }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#e2a84b' }}></span>
            <span className="text-sm" style={{ color: '#e2a84b' }}>
              音频驱动视频功能正式上线
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6" style={{ 
            fontFamily: "'Noto Serif SC', serif",
            color: '#f2efe9',
            letterSpacing: '0.05em'
          }}>
            拟像
          </h1>
          
          <p className="text-lg md:text-xl mb-4 tracking-widest uppercase"
            style={{ color: 'rgba(242,239,233,0.5)' }}>
            NI XIANG · AI CREATIVE STUDIO
          </p>
          
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12"
            style={{ color: 'rgba(242,239,233,0.7)' }}>
            从剧本到分镜到美术风格，三步完成专业影像创作。
            <br />
            <span style={{ color: 'rgba(242,239,233,0.5)' }}>
              企业级 AI 影像创作平台 · 中文原生
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SignedOut>
              <Link 
                href="/sign-up"
                className="px-8 py-4 text-base font-semibold rounded-xl transition-all hover:translate-y-[-4px] hover:shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, #e2a84b, #d4953f)',
                  color: '#000',
                  boxShadow: '0 0 30px rgba(226,168,75,0.3)'
                }}
              >
                开始创作
              </Link>
              <Link 
                href="/pricing"
                className="px-8 py-4 text-base font-semibold rounded-xl transition-all hover:translate-y-[-4px]"
                style={{ 
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#f2efe9'
                }}
              >
                查看定价
              </Link>
            </SignedOut>
            
            <SignedIn>
              <Link 
                href="/dashboard"
                className="px-8 py-4 text-base font-semibold rounded-xl transition-all hover:translate-y-[-4px] hover:shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, #e2a84b, #d4953f)',
                  color: '#000',
                  boxShadow: '0 0 30px rgba(226,168,75,0.3)'
                }}
              >
                进入控制台
              </Link>
              <Link 
                href="/pricing"
                className="px-8 py-4 text-base font-semibold rounded-xl transition-all hover:translate-y-[-4px]"
                style={{ 
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#f2efe9'
                }}
              >
                升级计划
              </Link>
            </SignedIn>
          </div>

          {/* Features Preview */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "文本生视频",
                desc: "输入文字描述，AI自动生成视频",
                color: "#e2a84b"
              },
              {
                title: "图像生视频",
                desc: "静态图片转换为动态视频",
                color: "#4fbdb5"
              },
              {
                title: "AI 分镜生成",
                desc: "智能分析剧本生成分镜",
                color: "#6891d8"
              }
            ].map((feature, index) => (
              <div key={index} 
                className="p-6 rounded-2xl text-left transition-all hover:translate-y-[-8px]"
                style={{ 
                  background: '#151515',
                  border: '1px solid rgba(255,255,255,0.07)'
                }}>
                <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                  style={{ background: `${feature.color}20` }}>
                  <div className="w-6 h-6 rounded-lg" style={{ background: feature.color }}></div>
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#f2efe9' }}>
                  {feature.title}
                </h3>
                <p className="text-sm" style={{ color: 'rgba(242,239,233,0.5)' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ 
              fontFamily: "'Noto Serif SC', serif",
              color: '#f2efe9'
            }}>
              全链路 AI 影像创作
            </h2>
            <p className="text-lg" style={{ color: 'rgba(242,239,233,0.5)' }}>
              从创意到成片，一站式解决方案
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "📝", title: "剧本创作", desc: "AI辅助剧本写作" },
              { icon: "🎬", title: "分镜生成", desc: "智能分镜设计" },
              { icon: "🎨", title: "角色生成", desc: "AI角色设计" },
              { icon: "✨", title: "风格迁移", desc: "一键风格转换" },
            ].map((item, index) => (
              <div key={index} 
                className="p-6 rounded-2xl text-center transition-all hover:scale-105"
                style={{ 
                  background: '#151515',
                  border: '1px solid rgba(255,255,255,0.07)'
                }}>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#f2efe9' }}>
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: 'rgba(242,239,233,0.5)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-24 px-6" style={{ background: '#0a0a0a' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ 
              fontFamily: "'Noto Serif SC', serif",
              color: '#f2efe9'
            }}>
              为不同场景打造
            </h2>
            <p className="text-lg" style={{ color: 'rgba(242,239,233,0.5)' }}>
              满足影视制作、广告创意、独立电影等多领域需求
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "影视制作",
                desc: "专业级视频生成，支持4K输出，满足院线及流媒体标准",
                color: "#e2a84b"
              },
              {
                title: "广告创意",
                desc: "快速生成多版本广告素材，提升创意迭代效率",
                color: "#4fbdb5"
              },
              {
                title: "独立电影",
                desc: "降低制作成本，让小团队也能实现大制作效果",
                color: "#6891d8"
              }
            ].map((solution, index) => (
              <div key={index} 
                className="p-8 rounded-2xl transition-all hover:translate-y-[-8px]"
                style={{ 
                  background: '#151515',
                  border: `1px solid ${solution.color}30`
                }}>
                <div className="w-16 h-1 rounded-full mb-6" style={{ background: solution.color }}></div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: '#f2efe9' }}>
                  {solution.title}
                </h3>
                <p style={{ color: 'rgba(242,239,233,0.6)' }}>
                  {solution.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ 
            fontFamily: "'Noto Serif SC', serif",
            color: '#f2efe9'
          }}>
            开始您的 AI 创作之旅
          </h2>
          <p className="text-lg mb-8" style={{ color: 'rgba(242,239,233,0.5)' }}>
            免费版即可体验核心功能，专业版解锁无限可能
          </p>
          
          <SignedOut>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/sign-up"
                className="px-8 py-4 text-base font-semibold rounded-xl transition-all hover:translate-y-[-4px] hover:shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, #e2a84b, #d4953f)',
                  color: '#000',
                  boxShadow: '0 0 30px rgba(226,168,75,0.3)'
                }}
              >
                免费注册
              </Link>
              <Link 
                href="/pricing"
                className="px-8 py-4 text-base font-semibold rounded-xl transition-all hover:translate-y-[-4px]"
                style={{ 
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#f2efe9'
                }}
              >
                查看定价
              </Link>
            </div>
          </SignedOut>
          
          <SignedIn>
            <Link 
              href="/dashboard"
              className="inline-block px-8 py-4 text-base font-semibold rounded-xl transition-all hover:translate-y-[-4px] hover:shadow-lg"
              style={{ 
                background: 'linear-gradient(135deg, #e2a84b, #d4953f)',
                color: '#000',
                boxShadow: '0 0 30px rgba(226,168,75,0.3)'
              }}
            >
              进入控制台
            </Link>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ 
                fontFamily: "'Noto Serif SC', serif",
                color: '#f2efe9'
              }}>
                拟<em style={{ color: '#e2a84b', fontStyle: 'normal' }}>像</em>
              </span>
            </div>
            
            <div className="flex items-center gap-8">
              <Link href="/pricing" className="text-sm transition-colors hover:text-white"
                style={{ color: 'rgba(242,239,233,0.5)' }}>
                定价
              </Link>
              <Link href="#" className="text-sm transition-colors hover:text-white"
                style={{ color: 'rgba(242,239,233,0.5)' }}>
                隐私政策
              </Link>
              <Link href="#" className="text-sm transition-colors hover:text-white"
                style={{ color: 'rgba(242,239,233,0.5)' }}>
                服务条款
              </Link>
            </div>
            
            <p className="text-sm" style={{ color: 'rgba(242,239,233,0.3)' }}>
              © 2026 拟像. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
