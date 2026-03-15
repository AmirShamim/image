export const initDB = () => {
  return new Promise((resolve, reject) => {
    // Open (or create) the database 'ImageResizerDB'
    const request = indexedDB.open('ImageResizerDB', 1);

    request.onerror = (event) => {
      console.error('IndexedDB Error:', event.target.errorCode);
      reject(event.target.errorCode);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    // This event is only implemented in recent browsers
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create an objectStore for this database
      if (!db.objectStoreNames.contains('history')) {
        const objectStore = db.createObjectStore('history', { keyPath: 'id' });
        
        // Define what data items the objectStore will contain
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

export const saveImageToHistory = async (imageData) => {
  try {
    const db = await initDB();
    const transaction = db.transaction(['history'], 'readwrite');
    const objectStore = transaction.objectStore('history');

    const imageEntry = {
      id: Date.now().toString(),
      ...imageData,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const request = objectStore.add(imageEntry);
      request.onsuccess = () => resolve(imageEntry);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('Failed to save to history:', error);
    throw error;
  }
};

export const getHistoryImages = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction(['history'], 'readonly');
    const objectStore = transaction.objectStore('history');

    return new Promise((resolve, reject) => {
      const request = objectStore.getAll();
      request.onsuccess = (event) => {
        // Sort newest first
        const history = event.target.result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(history);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('Failed to get history:', error);
    return [];
  }
};

export const deleteImageFromHistory = async (id) => {
  try {
    const db = await initDB();
    const transaction = db.transaction(['history'], 'readwrite');
    const objectStore = transaction.objectStore('history');

    return new Promise((resolve, reject) => {
      const request = objectStore.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('Failed to delete from history:', error);
    throw error;
  }
};

export const clearOldHistory = async (maxAgeMinutes = 30) => {
  try {
    const db = await initDB();
    const transaction = db.transaction(['history'], 'readwrite');
    const objectStore = transaction.objectStore('history');
    
    const maxAgeMs = maxAgeMinutes * 60 * 1000;
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const request = objectStore.getAll();
      request.onsuccess = (event) => {
        const records = event.target.result;
        let deletedCount = 0;
        
        records.forEach(record => {
          if (now - record.timestamp > maxAgeMs) {
            objectStore.delete(record.id);
            deletedCount++;
          }
        });
        
        resolve(deletedCount);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (error) {
    console.error('Failed to clear old history:', error);
    return 0;
  }
};
