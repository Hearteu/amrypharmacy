import { API_URL } from "../api-config";

const DB_NAME = "amrypharmacy-offline-db";
const STORE_NAME = "offline-transactions";

class OfflineSync {
  db: IDBDatabase | null = null;
  private pendingCountListeners: ((count: number) => void)[] = [];

  onPendingCountChange(callback: (count: number) => void) {
    this.pendingCountListeners.push(callback);
    this.getTransactions().then(txs => callback(txs.length));
    return () => {
      this.pendingCountListeners = this.pendingCountListeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    this.getTransactions().then(txs => {
      this.pendingCountListeners.forEach(l => l(txs.length));
    });
  }

  async initDB() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        }
      };
    });
  }

  async saveTransaction(transaction: any) {
    if (!this.db) await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.add({ data: transaction, timestamp: new Date().toISOString() });
      request.onsuccess = () => {
        this.notifyListeners();
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getTransactions() {
    if (!this.db) await this.initDB();
    return new Promise<any[]>((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeTransaction(id: number) {
    if (!this.db) await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => {
        this.notifyListeners();
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async syncTransactions() {
    if (!navigator.onLine) return;
    
    const transactions = await this.getTransactions();
    if (transactions.length === 0) return;

    for (const tx of transactions) {
      try {
        const response = await fetch(`${API_URL}/pos/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tx.data),
        });

        if (response.ok) {
          await this.removeTransaction(tx.id);
        }
      } catch (err) {
        console.error("Failed to sync offline transaction", tx.id, err);
      }
    }
  }
}

export const offlineSync = new OfflineSync();

// Auto-sync when coming online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    offlineSync.syncTransactions();
  });
}
