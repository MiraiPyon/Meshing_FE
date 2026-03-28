import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { isAuthenticated } from "../lib/auth";
import hcmutLogo from "../HCMUT.png";

const GOOGLE_CLIENT_ID = "281714396823-ouc85peol850htcsr2rci0iahsjec9sl.apps.googleusercontent.com";
const GOOGLE_REDIRECT_URI = "http://localhost:5173/auth/callback";

const GOOGLE_SIGN_IN_URL = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
  client_id: GOOGLE_CLIENT_ID,
  redirect_uri: GOOGLE_REDIRECT_URI,
  response_type: "code",
  scope: "openid email profile",
  access_type: "offline",
  prompt: "consent",
}).toString()}`;

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M21.805 10.023H12v3.955h5.627c-.242 1.272-.968 2.35-2.057 3.073v2.554h3.33c1.95-1.795 3.07-4.438 3.07-7.56 0-.673-.06-1.32-.165-2.022Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.79 0 5.13-.925 6.84-2.395l-3.33-2.554c-.925.622-2.108.997-3.51.997-2.695 0-4.98-1.82-5.798-4.268H2.76v2.635A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.202 13.78A5.995 5.995 0 0 1 5.88 12c0-.617.112-1.215.322-1.78V7.585H2.76A10 10 0 0 0 2 12c0 1.61.385 3.134 1.06 4.415l3.142-2.635Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.952c1.518 0 2.88.522 3.952 1.545l2.962-2.963C17.125 2.868 14.785 2 12 2A10 10 0 0 0 2.76 7.585L6.202 10.22C7.02 7.772 9.305 5.952 12 5.952Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#030303] font-sans">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-white/5 bg-[#050505] lg:flex">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
            className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-30"
          >
            <svg viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.path
                  key={i}
                  d={`M400 400 L${400 + 300 * Math.cos((i * 30 * Math.PI) / 180)} ${400 + 300 * Math.sin((i * 30 * Math.PI) / 180)} L${400 + 200 * Math.cos(((i + 2) * 30 * Math.PI) / 180)} ${400 + 200 * Math.sin(((i + 2) * 30 * Math.PI) / 180)} Z`}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-blue-500/20"
                />
              ))}
            </svg>
          </motion.div>
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[100px]" />
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#050505] to-transparent" />
        </div>

        <div className="relative z-10 mt-auto p-12">
          <div className="mb-6 flex items-center gap-3 text-white">
            <div>
              <img
                src={hcmutLogo}
                alt="HCMUT logo"
                className="h-[54px] w-[54px] object-cover"
              />
            </div>
            <span className="text-xl font-semibold tracking-tight">Nhóm 3</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white">Đồ Án Thực Tập Đa Ngành</h1>
          <p className="max-w-md text-lg text-zinc-400">
            Nguyễn Nhật Quang - Tô Nguyên Khoa - Từ Bá Lộc - Huỳnh Hoàng Tuấn - Nguyễn Tăng Trung
          </p>
        </div>
      </div>

      <div className="relative z-10 flex w-full items-center justify-center bg-[#030303] p-8 sm:p-12 lg:w-1/2">
        <Link
          to="/"
          className="group absolute left-8 top-8 z-20 inline-flex items-center justify-center gap-2 rounded-xl border border-black bg-gradient-to-b from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-[0_0_30px_rgba(37,99,235,0.25)] hover:from-blue-500 hover:to-purple-500 hover:shadow-[0_0_40px_rgba(124,58,237,0.35)] sm:left-12 sm:top-12"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Quay lại trang chủ
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-8"
        >
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white">Đăng nhập</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Click vào nút bên dưới để đăng nhập bằng tài khoản Google. Sau khi xácc thực thành công, bạn sẽ được chuyển hướng đến Workspace!
            </p>
          </div>

          <a
            href={GOOGLE_SIGN_IN_URL}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-black bg-gradient-to-b from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-[0_0_30px_rgba(37,99,235,0.25)] hover:from-blue-500 hover:to-purple-500 hover:shadow-[0_0_40px_rgba(124,58,237,0.35)] sm:left-12 sm:top-12"
          >
            <GoogleIcon />
            <span>Sign in with Google</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </div>
  );
}
