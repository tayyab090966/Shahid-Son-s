import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  writeBatch, 
  serverTimestamp, 
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ShopTransaction } from '../types';

// Escapes book name for safe Firestore document ID layout
export function escapeDocId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

/**
 * Ensures user document exists at /users/{userId} to satisfy core rules schema constraints.
 */
export async function ensureUserDoc(userId: string, email: string) {
  const userRef = doc(db, 'users', userId);
  try {
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        userId,
        email,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(userRef, {
        userId,
        email,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
  }
}

/**
 * Bidirectional integration that synchronizes local transactions & books with the Firestore remote backup.
 */
export async function performCloudSync(
  userId: string,
  localTx: ShopTransaction[],
  localBooks: string[]
): Promise<{ mergedTx: ShopTransaction[]; mergedBooks: string[] }> {
  
  const txPath = `users/${userId}/transactions`;
  const booksPath = `users/${userId}/books`;

  try {
    // 1. Fetch Remote Records from user sub-collections
    const txSnap = await getDocs(collection(db, txPath));
    const booksSnap = await getDocs(collection(db, booksPath));

    const remoteTxMap = new Map<string, ShopTransaction>();
    txSnap.forEach((doc) => {
      const data = doc.data();
      remoteTxMap.set(data.id, {
        id: data.id,
        title: data.title,
        book: data.book,
        amount: Number(data.amount),
        isIncome: Boolean(data.isIncome),
        date: data.date,
        userId: data.userId
      });
    });

    const remoteBooksSet = new Set<string>();
    booksSnap.forEach((doc) => {
      const data = doc.data();
      if (data && data.name) {
        remoteBooksSet.add(data.name);
      }
    });

    const mergedTxList: ShopTransaction[] = [...localTx];
    const uploadQueue: ShopTransaction[] = [];

    // Identify local-only items that need backup uploaded
    localTx.forEach((tx) => {
      if (!remoteTxMap.has(tx.id)) {
        uploadQueue.push(tx);
      }
    });

    // Pull missing cloud transactions down locally
    remoteTxMap.forEach((rtx, id) => {
      if (!localTx.some((ltx) => ltx.id === id)) {
        mergedTxList.push(rtx);
      }
    });

    // Sort to keep newest cashbook entries at peak
    mergedTxList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Merge Books lists
    const mergedBooksList = Array.from(new Set([...localBooks, ...remoteBooksSet]));
    const booksToUpload: string[] = [];
    localBooks.forEach((b) => {
      if (!remoteBooksSet.has(b)) {
        booksToUpload.push(b);
      }
    });

    // 2. Commit Upload Queue to cloud under 400 op chunks for write limits safety
    if (uploadQueue.length > 0 || booksToUpload.length > 0) {
      let batch = writeBatch(db);
      let opCount = 0;

      // Transactions backup
      for (const tx of uploadQueue) {
        const txDocRef = doc(db, txPath, tx.id);
        batch.set(txDocRef, {
          id: tx.id,
          title: tx.title,
          book: tx.book,
          amount: Number(tx.amount),
          isIncome: Boolean(tx.isIncome),
          date: tx.date,
          userId: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        opCount++;

        if (opCount >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      // Books backup
      for (const book of booksToUpload) {
        const bDocId = escapeDocId(book);
        const bookDocRef = doc(db, booksPath, bDocId);
        batch.set(bookDocRef, {
          name: book,
          userId: userId,
          createdAt: serverTimestamp()
        });
        opCount++;

        if (opCount >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      if (opCount > 0) {
        await batch.commit();
      }
    }

    return {
      mergedTx: mergedTxList,
      mergedBooks: mergedBooksList
    };

  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${userId}`);
    return { mergedTx: localTx, mergedBooks: localBooks };
  }
}

/**
 * Synchronizes single transaction deletion to cloud
 */
export async function deleteTransactionFromCloud(userId: string, transactionId: string) {
  const docPath = `users/${userId}/transactions/${transactionId}`;
  try {
    const docRef = doc(db, 'users', userId, 'transactions', transactionId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}

/**
 * Synchronizes single transaction creation/saving to cloud
 */
export async function saveTransactionToCloud(userId: string, tx: ShopTransaction) {
  const docPath = `users/${userId}/transactions/${tx.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'transactions', tx.id);
    await setDoc(docRef, {
      id: tx.id,
      title: tx.title,
      book: tx.book,
      amount: Number(tx.amount),
      isIncome: Boolean(tx.isIncome),
      date: tx.date,
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, docPath);
  }
}

/**
 * Synchronizes single custom ledger book to cloud
 */
export async function saveBookToCloud(userId: string, bookName: string) {
  const bDocId = escapeDocId(bookName);
  const docPath = `users/${userId}/books/${bDocId}`;
  try {
    const docRef = doc(db, 'users', userId, 'books', bDocId);
    await setDoc(docRef, {
      name: bookName,
      userId: userId,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, docPath);
  }
}

/**
 * Renames a book in Firestore by deleting the old book, creating the new book, and updating affected transactions in bulk
 */
export async function renameBookInCloud(
  userId: string,
  oldBookName: string,
  newBookName: string,
  affectedTransactions: ShopTransaction[]
) {
  const booksPath = `users/${userId}/books`;
  const txPath = `users/${userId}/transactions`;
  
  try {
    const batch = writeBatch(db);
    
    // 1. Delete old book doc
    const oldBookDocId = escapeDocId(oldBookName);
    const oldBookRef = doc(db, 'users', userId, 'books', oldBookDocId);
    batch.delete(oldBookRef);
    
    // 2. Create new book doc
    const newBookDocId = escapeDocId(newBookName);
    const newBookRef = doc(db, 'users', userId, 'books', newBookDocId);
    batch.set(newBookRef, {
      name: newBookName,
      userId: userId,
      createdAt: serverTimestamp()
    });
    
    // 3. Update all corresponding transactions' book name to the new book name
    for (const tx of affectedTransactions) {
      const txDocRef = doc(db, 'users', userId, 'transactions', tx.id);
      batch.set(txDocRef, {
        id: tx.id,
        title: tx.title,
        book: newBookName,
        amount: Number(tx.amount),
        isIncome: Boolean(tx.isIncome),
        date: tx.date,
        userId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/books/rename`);
  }
}

