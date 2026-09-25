import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = { description: string; title?: string; confirmLabel?: string };
type ConfirmRequest = ConfirmOptions & { resolve: (confirmed: boolean) => void };

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const resolvingRef = useRef(false);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    setRequest({ ...options, resolve });
  }), []);

  const finish = (confirmed: boolean) => {
    if (!request || resolvingRef.current) return;
    resolvingRef.current = true;
    request.resolve(confirmed);
    setRequest(null);
    queueMicrotask(() => { resolvingRef.current = false; });
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={Boolean(request)} onOpenChange={(open) => { if (!open) finish(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{request?.title ?? "Confirmar exclusão"}</AlertDialogTitle>
            <AlertDialogDescription>{request?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => finish(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => finish(true)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {request?.confirmLabel ?? "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  return context;
}