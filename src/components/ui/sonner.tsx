import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      richColors
      closeButton
      expand={true}
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#1f1f1f] group-[.toaster]:text-white group-[.toaster]:border-[#3a3a3a] group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:px-5 group-[.toaster]:py-4 group-[.toaster]:min-w-[320px] group-[.toaster]:max-w-[calc(100vw-32px)] group-[.toaster]:backdrop-blur-sm",
          description: "group-[.toast]:text-gray-200 group-[.toast]:text-sm group-[.toast]:leading-relaxed group-[.toast]:mt-1",
          title: "group-[.toast]:text-white group-[.toast]:font-semibold group-[.toast]:text-base group-[.toast]:leading-tight",
          success: "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-primary/90 group-[.toaster]:to-orange-500/80 group-[.toaster]:border-primary/60 group-[.toaster]:text-white group-[.toaster]:shadow-primary/30",
          error: "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-red-600/30 group-[.toaster]:to-red-500/20 group-[.toaster]:border-red-400/60 group-[.toaster]:text-red-50 group-[.toaster]:shadow-red-500/20",
          warning: "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-yellow-600/30 group-[.toaster]:to-yellow-500/20 group-[.toaster]:border-yellow-400/60 group-[.toaster]:text-yellow-50 group-[.toaster]:shadow-yellow-500/20",
          info: "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-blue-600/30 group-[.toaster]:to-blue-500/20 group-[.toaster]:border-blue-400/60 group-[.toaster]:text-blue-50 group-[.toaster]:shadow-blue-500/20",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-white group-[.toast]:hover:bg-primary/90 group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:text-sm group-[.toast]:font-medium group-[.toast]:transition-colors",
          cancelButton: "group-[.toast]:bg-muted/80 group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:text-sm group-[.toast]:transition-colors",
          closeButton: "group-[.toast]:text-gray-400 group-[.toast]:hover:text-white group-[.toast]:hover:bg-white/10 group-[.toast]:rounded-md",
        },
      }}
      style={{
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
