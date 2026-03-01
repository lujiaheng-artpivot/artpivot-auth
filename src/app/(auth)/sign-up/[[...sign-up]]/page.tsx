import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #080808 0%, #101010 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ 
            fontFamily: "'Noto Serif SC', serif",
            color: '#f2efe9'
          }}>
            拟像
          </h1>
          <p className="text-sm" style={{ color: 'rgba(242,239,233,0.5)' }}>
            AI 影像创作平台
          </p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: {
                width: '100%'
              }
            }
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
