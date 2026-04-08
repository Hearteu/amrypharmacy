"use client";

import { useEffect, useState } from "react";
import { offlineSync } from "@/app/lib/services/offline-sync";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const unsubscribe = offlineSync.onPendingCountChange((count) => {
      setPendingCount(count);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      await offlineSync.syncTransactions();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={handleManualSync}
          >
            {isOnline ? (
              <Badge variant="outline" className={`flex items-center gap-1.5 ${pendingCount > 0 ? "border-orange-500 text-orange-600" : "border-green-500 text-green-600"}`}>
                {isSyncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Cloud className="h-3 w-3" />
                )}
                <span className="text-[10px] font-bold">
                  {pendingCount > 0 ? `${pendingCount} PENDING` : "SYNCED"}
                </span>
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1.5 animate-pulse">
                <CloudOff className="h-3 w-3" />
                <span className="text-[10px] font-bold">OFFLINE ({pendingCount})</span>
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isOnline 
              ? pendingCount > 0 
                ? `Click to sync ${pendingCount} pending transactions` 
                : "System is online and synced" 
              : "System is offline. Transactions will be saved locally."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
