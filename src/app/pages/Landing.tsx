import { motion } from "motion/react";
import { Link } from "react-router";
import {
  ArrowRight,
  Layers,
  Box,
  BarChart3,
  Triangle,
  Hexagon,
  Component,
  GitCommitHorizontal,
  Cpu,
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export function Landing() {
  return (
    <div className="min-h-screen bg-[#030303] text-zinc-200 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-[#030303]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <span className="text-xl font-bold tracking-tight text-white">
                Nhóm 3
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-6"
            >
              <Link
                to="/login"
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              ></Link>
              <Link
                to="/login"
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Đăng Nhập
              </Link>
              <Link
                to="/login"
                className="relative group px-5 py-2.5 text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
              >
                <span className="relative z-10 flex items-center">
                  Đăng Ký{" "}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg blur-xl -z-10"></div>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <div className="relative pt-32 pb-24 lg:pt-48 lg:pb-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="max-w-4xl mx-auto"
            >
              <motion.h1
                variants={fadeIn}
                className="text-6xl md:text-7xl font-bold tracking-tighter text-white mb-8 leading-[1.1]"
              >
                Đồ Án Thực Tập Đa Ngành
                <br />
              </motion.h1>

              <motion.p
                variants={fadeIn}
                className="text-xl text-zinc-400 mb-12 max-w-5xl mx-auto leading-relaxed"
              >
                Nguyễn Nhật Quang - Tô Nguyên Khoa - Từ Bá Lộc -
                Huỳnh Hoàng Tuấn - Nguyễn Tăng Trung
              </motion.p>

              <motion.div
                variants={fadeIn}
                className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6"
              >
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] border border-blue-500/50"
                >
                  Khám Phá
                </Link>
                <a
                  href="#architecture"
                  className="w-full sm:w-auto px-8 py-4 text-base font-medium text-zinc-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center justify-center"
                >
                  System Architecture
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div
          className="py-24 bg-[#050505] relative border-t border-white/5"
          id="architecture"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-20"
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                System Architecture
              </h2>
              <p className="text-zinc-400 max-w-2xl text-lg">
                Hệ thống tích hợp quy trình xử lý hình học chuẩn
                hóa PSLG, tự động phân loại biên và tối ưu hóa
                lưới qua thuật toán Delaunay Refinement. Công cụ
                đảm bảo chất lượng phần tử với ngưỡng góc min
                lớn hơn 20.7 độ và kiểm soát sai số rời rạc chặt
                chẽ, mang lại mô hình tính toán ổn định và có độ
                tin cậy cao.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <motion.div
                whileHover={{ y: -5 }}
                className="group relative p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 hover:border-blue-500/50 transition-colors"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                    <Component className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Geometric Modeling
                  </h3>
                  <p className="text-zinc-400 mb-6 leading-relaxed text-sm">
                    Các định nghĩa biên được ánh xạ trực tiếp
                    sang cấu trúc PSLG. Hệ thống tự động loại bỏ
                    các điểm trùng lặp và nhận diện chính xác
                    các vòng lặp biên trong/ngoài (CCW/CW).
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Theo dõi biên ngoài (CCW) và biên trong (CW)",
                      "Kiểm tra giao cắt giữa các biên phụ",
                      "Hợp nhất nút topo (Topological node merging)",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center text-sm text-zinc-500"
                      >
                        <Hexagon className="w-4 h-4 mr-3 text-blue-500/50" />{" "}
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                whileHover={{ y: -5 }}
                className="group relative p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 hover:border-indigo-500/50 transition-colors"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
                    <GitCommitHorizontal className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Delaunay Engine
                  </h3>
                  <p className="text-zinc-400 mb-6 leading-relaxed text-sm">
                    Khởi tạo lưới bằng thuật toán
                    Divide-and-Conquer với các ràng buộc tinh
                    chỉnh thời gian thực. Đảm bảo góc tối thiểu
                    và tỷ lệ bán kính đường tròn ngoại tiếp tối
                    ưu.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Loại bỏ phần tử mảnh (θ > 20.7°)",
                      "Chia nhỏ các cạnh bị xâm phạm",
                      "Xác thực biên bằng thuật toán Cast Ray",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center text-sm text-zinc-500"
                      >
                        <Hexagon className="w-4 h-4 mr-3 text-indigo-500/50" />{" "}
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Card 3 */}
              <motion.div
                whileHover={{ y: -5 }}
                className="group relative p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 hover:border-purple-500/50 transition-colors"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20">
                    <Cpu className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Analysis Dashboard
                  </h3>
                  <p className="text-zinc-400 mb-6 leading-relaxed text-sm">
                    Trực quan hóa dữ liệu lưới và phân tích lỗi
                    theo thời gian thực. Tích hợp các bộ lọc và
                    công cụ theo dõi thuộc tính phần tử lưới.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Tính toán Bậc tự do (DOF) (T3/Q4 nodes)",
                      "Phân bổ sai số rời rạc",
                      "Phân tích phân bố kích thước phần tử",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center text-sm text-zinc-500"
                      >
                        <Hexagon className="w-4 h-4 mr-3 text-purple-500/50" />{" "}
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#030303] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="text-zinc-500 font-medium">
              Nhóm 3
            </span>
          </div>
          <p className="text-zinc-600 text-sm">
            Nhóm 3 &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

