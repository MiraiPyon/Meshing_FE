import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

type LogoutConfirmDialogProps = {
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function LogoutConfirmDialog({
  onConfirm,
  onOpenChange,
  open,
}: LogoutConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-white/10 bg-[#0b1120] text-zinc-200 shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Xác nhận đăng xuất
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản hiện tại không?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white">
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-500"
          >
            Đăng xuất
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
