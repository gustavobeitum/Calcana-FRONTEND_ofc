import { useTheme } from "../theme/theme-provider";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          
          success: "group-[.toast]:bg-primary/5 group-[.toast]:text-primary group-[.toast]:border-primary/20",
          error: "group-[.toast]:bg-destructive/5 group-[.toast]:text-destructive group-[.toast]:border-destructive/20",
          warning: "group-[.toast]:bg-yellow-500/5 group-[.toast]:text-yellow-600 dark:group-[.toast]:text-yellow-400 group-[.toast]:border-yellow-500/20",
          
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };