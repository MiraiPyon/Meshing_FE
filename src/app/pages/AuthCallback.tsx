import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { LoaderCircle } from "lucide-react";
import {
  markAuthenticated,
  storeAuthProfile,
} from "../../infrastructure/auth/local-storage-auth";
import { apiClient } from "../../services/apiClient";

export function AuthCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");

    if (!code) {
      navigate("/login", { replace: true });
      return;
    }

    // Call Backend
    apiClient.exchangeAuthCode(code)
      .then((tokenData) => {
        // Lưu Access Token
        if (typeof window !== "undefined") {
          window.localStorage.setItem("access_token", tokenData.access_token);
        }
        
        return apiClient.getMe(tokenData.access_token);
      })
      .then((userData) => {
        markAuthenticated();
        storeAuthProfile({
          name: userData.name,
          email: userData.email,
        });
        navigate("/dashboard", { replace: true });
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(err.message || "Xác thực thất bại");
        setTimeout(() => navigate("/login", { replace: true }), 3000);
      });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030303] px-6 text-zinc-300">
      <div className="flex max-w-md flex-col items-center rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-10 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        {errorMsg ? (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              X
            </div>
            <h1 className="text-xl font-semibold text-white">Lỗi xác thực</h1>
            <p className="mt-2 text-sm leading-6 text-red-400">{errorMsg}</p>
          </>
        ) : (
          <>
            <LoaderCircle className="h-10 w-10 animate-spin text-blue-400" />
            <h1 className="mt-5 text-xl font-semibold text-white">Đang gọi Backend</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Hệ thống đang trao đổi mã xác thực với Backend và lấy thông tin tài khoản...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
