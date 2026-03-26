import { useEffect } from "react";
import { useNavigate } from "react-router";
import { LoaderCircle } from "lucide-react";
import { createAuthProfileFromParams, hasOAuthSuccessParams, markAuthenticated, storeAuthProfile } from "../lib/auth";

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    if (hasOAuthSuccessParams(searchParams)) {
      markAuthenticated();
      storeAuthProfile(createAuthProfileFromParams(searchParams));
      navigate("/dashboard", { replace: true });
      return;
    }

    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030303] px-6 text-zinc-300">
      <div className="flex max-w-md flex-col items-center rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-10 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <LoaderCircle className="h-10 w-10 animate-spin text-blue-400" />
        <h1 className="mt-5 text-xl font-semibold text-white">Dang xu ly dang nhap Google</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          He thong dang kiem tra ket qua xac thuc va chuyen ban vao bang ve.
        </p>
      </div>
    </div>
  );
}
