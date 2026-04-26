import { useEffect, useRef, useState, type MouseEvent } from "react";
import { motion, type Variants } from "motion/react";
import { Link } from "react-router";
import {
  ArrowRight,
  Hexagon,
  Component,
  GitCommitHorizontal,
  Cpu,
  CircleUserRound,
  LogOut,
} from "lucide-react";
import hcmutLogo from "../HCMUT.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { LogoutConfirmDialog } from "../components/auth/LogoutConfirmDialog";
import {
  clearAuthentication,
  getAuthProfile,
  isAuthenticated,
  type AuthProfile,
} from "../../infrastructure/auth/local-storage-auth";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
} satisfies Variants;

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} satisfies Variants;

export function Landing() {
  const architectureRef = useRef<HTMLElement | null>(null);
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [profile, setProfile] = useState<AuthProfile | null>(() =>
    getAuthProfile(),
  );

  useEffect(() => {
    const syncAuthState = () => {
      setAuthenticated(isAuthenticated());
      setProfile(getAuthProfile());
    };

    window.addEventListener("storage", syncAuthState);
    window.addEventListener("focus", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("focus", syncAuthState);
    };
  }, []);

  const handleArchitectureClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const architectureSection = architectureRef.current;
    if (!architectureSection) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const stickyNavOffset = 112;
    const architectureTop =
      window.scrollY +
      architectureSection.getBoundingClientRect().top -
      stickyNavOffset;

    window.scrollTo({
      top: architectureTop,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  const handleLogout = () => {
    clearAuthentication();
    setAuthenticated(false);
    setProfile(null);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#030303] font-sans text-zinc-200 selection:bg-blue-500/30">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-blue-600/10 blur-[120px]"></div>
        <div className="absolute right-[-10%] top-[20%] h-[40%] w-[40%] rounded-full bg-indigo-600/10 blur-[120px]"></div>
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#030303]/50 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <img
                src={hcmutLogo}
                alt="HCMUT logo"
                className="h-[4.125rem] w-[4.125rem] rounded-full object-cover"
              />
              <span className="text-xl font-bold tracking-tight text-white">
                Group 3
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center"
            >
              {authenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Open user menu"
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-100 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:border-purple-400/60 hover:bg-purple-500 hover:text-white hover:shadow-[0_0_40px_rgba(37,99,235,0.5)]"
                    >
                      <CircleUserRound className="h-6 w-6" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 border-white/10 bg-[#111111]/95 p-2 text-zinc-200 backdrop-blur-xl"
                  >
                    <DropdownMenuLabel className="px-3 py-2">
                      <div className="text-sm font-semibold text-white">
                        {profile?.name ?? "Google user"}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {profile?.email ?? "Signed in"}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      onSelect={() => setLogoutDialogOpen(true)}
                      className="group cursor-pointer rounded-lg px-3 py-2 font-semibold text-red-400 transition-all hover:bg-red-500/10 hover:text-red-400 focus:bg-red-500/10 focus:text-red-400"
                    >
                      <LogOut className="h-4 w-4 text-sm font-semibold transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-rotate-6 group-focus:translate-x-0.5 group-focus:-rotate-6" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              {!authenticated ? (
                <Link
                  to="/login"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-black bg-gradient-to-b from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-[0_0_30px_rgba(37,99,235,0.25)] hover:from-blue-500 hover:to-purple-500 hover:shadow-[0_0_40px_rgba(124,58,237,0.35)]"
                >
                  <span className="leading-none">Sign In</span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : null}
            </motion.div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <div className="relative pb-32 pt-32 lg:pb-40 lg:pt-48">
          <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="mx-auto max-w-4xl"
            >
              <motion.h1
                variants={fadeIn}
                className="mb-8 text-6xl font-bold leading-[1.1] tracking-tighter text-white md:text-7xl"
              >
                Multidisciplinary Project
              </motion.h1>

              <motion.p
                variants={fadeIn}
                className="mx-auto mb-12 max-w-5xl text-xl leading-relaxed text-zinc-400"
              >
                Nguyễn Nhật Quang - Tô Nguyên Khoa - Từ Bá Lộc - Huỳnh Hoàng
                Tuấn - Nguyễn Tăng Trung
              </motion.p>

                <motion.div
                  variants={fadeIn}
                  className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0"
                >
                  <Link
                    to={authenticated ? "/dashboard" : "/login"}
                    className="w-full rounded-xl border border-blue-500/50 bg-blue-600 px-8 py-4 text-base font-semibold text-white transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:bg-blue-500 hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] sm:w-auto"
                  >
                    Explore
                  </Link>
                <a
                  href="#architecture"
                  onClick={handleArchitectureClick}
                  className="w-full rounded-xl border border-purple-500/50 bg-purple-600 px-8 py-4 text-base font-semibold text-white transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:bg-purple-500 hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] sm:w-auto"
                >
                  System Architecture
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <section
          id="architecture"
          ref={architectureRef}
          className="relative scroll-mt-28 border-t border-white/5 bg-[#050505] pb-24 pt-28"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-20"
            >
              <h2 className="mb-4 text-3xl font-bold text-white">
                System Architecture
              </h2>
              <p className="max-w-2xl text-lg text-zinc-400">
                The system simulates the PSLG normalization process, generates meshes using Delaunay Refinement, and visualizes mesh quality metrics for analysis.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <motion.div
                whileHover={{ y: -5 }}
                className="group relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 transition-colors hover:border-blue-500/50"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                <div className="relative z-10">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
                    <Component className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-white">
                    Geometric Modeling
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-zinc-400">
                    Convert geometric boundaries to a PSLG structure, merge topological nodes, and accurately detect outer loops and holes before meshing.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Ensure outer boundary is CCW and holes are CW",
                      "Check intersections between boundary segments",
                      "Merge coincident topological nodes",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center text-sm text-zinc-500"
                      >
                        <Hexagon className="mr-3 h-4 w-4 text-blue-500/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="group relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 transition-colors hover:border-indigo-500/50"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                <div className="relative z-10">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
                    <GitCommitHorizontal className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-white">
                    Delaunay Engine
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-zinc-400">
                    Generate meshes using Delaunay Refinement with constraints on minimum angle, circumradius ratio, and maximum edge length.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Remove skinny elements with very small angles",
                      "Refine edges that violate constraints",
                      "Domain checks via ray casting",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center text-sm text-zinc-500"
                      >
                        <Hexagon className="mr-3 h-4 w-4 text-indigo-500/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="group relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 transition-colors hover:border-purple-500/50"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                <div className="relative z-10">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10">
                    <Cpu className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-white">
                    Analysis Dashboard
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-zinc-400">
                    Visualize mesh data, element quality, and statistics for testing, optimization, and model evaluation.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Compute degrees of freedom for T3 and Q4",
                      "Discrete error distribution",
                      "Element size analysis",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center text-sm text-zinc-500"
                      >
                        <Hexagon className="mr-3 h-4 w-4 text-purple-500/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 bg-[#030303] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between px-6 lg:flex-row lg:px-8">
          <div className="mb-4 flex items-center space-x-2 lg:mb-0">
            <span className="font-medium text-zinc-500">Group 3</span>
          </div>
          <p className="text-sm text-zinc-600">
            Group 3 &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirm={handleLogout}
      />
    </div>
  );
}
