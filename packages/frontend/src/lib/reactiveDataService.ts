/**
 * RxJS Reactive Data Service
 * 
 * Manages complex async operations and real-time data streams using RxJS.
 * Provides reactive flows for Firebase real-time updates, batch operations,
 * and coordinated async tasks.
 * 
 * Features:
 * - Real-time Firebase data streams
 * - Batch operation coordination
 * - Debounced search
 * - Error handling and retry logic
 */

import { 
  Observable, 
  Subject, 
  BehaviorSubject, 
  fromEvent, 
  merge,
  combineLatest,
  of,
  throwError
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  retry,
  shareReplay,
  map,
  filter,
} from 'rxjs/operators';

// Real-time update types
export interface RealtimeUpdate<T> {
  type: 'added' | 'modified' | 'removed';
  data: T;
  timestamp: number;
}

export interface BatchOperation {
  id: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
}

/**
 * Reactive Data Service
 */
export class ReactiveDataService {
  // Search query stream
  private searchQuery$ = new Subject<string>();
  
  // Batch operation status stream
  private batchOperations$ = new BehaviorSubject<Map<string, BatchOperation>>(new Map());
  
  // Real-time updates stream
  private realtimeUpdates$ = new Subject<RealtimeUpdate<unknown>>();

  /**
   * Create a debounced search observable
   * Debounces search input and performs search operation
   */
  createDebouncedSearch<T>(
    searchFn: (query: string) => Promise<T[]>,
    debounceMs: number = 300
  ): Observable<T[]> {
    return this.searchQuery$.pipe(
      debounceTime(debounceMs),
      distinctUntilChanged(),
      filter(query => query.length >= 2), // Minimum 2 characters
      switchMap(query =>
        of(query).pipe(
          switchMap(q => searchFn(q)),
          catchError(error => {
            console.error('Search error:', error);
            return of([]);
          })
        )
      ),
      shareReplay(1)
    );
  }

  /**
   * Emit search query
   */
  search(query: string): void {
    this.searchQuery$.next(query);
  }

  /**
   * Create a Firebase real-time observable
   * Converts Firebase snapshots to observable stream
   */
  createRealtimeObservable<T>(
    subscribe: (callback: (data: T) => void) => () => void
  ): Observable<T> {
    return new Observable<T>(subscriber => {
      const unsubscribe = subscribe((data: T) => {
        subscriber.next(data);
      });

      return () => {
        unsubscribe();
      };
    }).pipe(
      retry({
        count: 3,
        delay: 1000,
      }),
      catchError(error => {
        console.error('Real-time stream error:', error);
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }

  /**
   * Create a batch operation tracker
   * Tracks multiple operations in parallel with progress updates
   */
  createBatchOperationTracker(
    operations: Array<() => Promise<unknown>>,
    batchId: string
  ): Observable<BatchOperation> {
    const totalOps = operations.length;
    
    // Initialize batch operation
    this.updateBatchOperation(batchId, {
      id: batchId,
      status: 'processing',
      progress: 0,
    });

    return new Observable<BatchOperation>(subscriber => {
      let completed = 0;

      const processOperation = async (op: () => Promise<unknown>, _index: number) => {
        try {
          await op();
          completed++;
          
          const progress = (completed / totalOps) * 100;
          const status = completed === totalOps ? 'complete' : 'processing';
          
          const operation = {
            id: batchId,
            status,
            progress,
          } as BatchOperation;
          
          this.updateBatchOperation(batchId, operation);

          subscriber.next(operation);
          
          if (completed === totalOps) {
            subscriber.complete();
          }
        } catch (error) {
          this.updateBatchOperation(batchId, {
            id: batchId,
            status: 'error',
            progress: (completed / totalOps) * 100,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          subscriber.error(error);
        }
      };

      // Process operations sequentially in chunks to avoid race conditions
      const processChunk = async (startIndex: number, chunkSize: number = 5) => {
        const chunk = operations.slice(startIndex, startIndex + chunkSize);
        await Promise.all(chunk.map((op, idx) => processOperation(op, startIndex + idx)));
        
        if (startIndex + chunkSize < operations.length) {
          await processChunk(startIndex + chunkSize, chunkSize);
        }
      };

      processChunk(0).catch(error => subscriber.error(error));
    });
  }

  /**
   * Update batch operation status
   */
  private updateBatchOperation(id: string, operation: BatchOperation): void {
    const operations = new Map(this.batchOperations$.value);
    operations.set(id, operation);
    this.batchOperations$.next(operations);
  }

  /**
   * Get batch operations observable
   */
  getBatchOperations(): Observable<Map<string, BatchOperation>> {
    return this.batchOperations$.asObservable();
  }

  /**
   * Get specific batch operation
   */
  getBatchOperation(id: string): Observable<BatchOperation | undefined> {
    return this.batchOperations$.pipe(
      map(operations => operations.get(id))
    );
  }

  /**
   * Create a combined real-time observable
   * Combines multiple Firebase streams into a single observable
   */
  combineRealtimeStreams<T1, T2>(
    stream1: Observable<T1>,
    stream2: Observable<T2>
  ): Observable<[T1, T2]> {
    return combineLatest([stream1, stream2]).pipe(
      shareReplay(1)
    );
  }

  /**
   * Create an auto-refresh observable
   * Periodically refreshes data with exponential backoff on errors
   */
  createAutoRefreshObservable<T>(
    refreshFn: () => Promise<T>,
    intervalMs: number = 30000
  ): Observable<T> {
    let retryCount = 0;
    const maxRetries = 5;
    let refreshTimer: NodeJS.Timeout | null = null;

    return new Observable<T>(subscriber => {
      const refresh = async () => {
        try {
          const data = await refreshFn();
          retryCount = 0; // Reset on success
          subscriber.next(data);
          
          // Schedule next refresh
          refreshTimer = setTimeout(() => {
            refresh();
          }, intervalMs);
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            subscriber.error(error);
          } else {
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
            refreshTimer = setTimeout(() => {
              refresh();
            }, delay);
          }
        }
      };

      // Start first refresh
      refresh();

      // Cleanup function
      return () => {
        if (refreshTimer) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }
      };
    }).pipe(shareReplay(1));
  }

  /**
   * Monitor network status
   */
  createNetworkStatusObservable(): Observable<boolean> {
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    return merge(
      of(navigator.onLine),
      online$,
      offline$
    ).pipe(
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.searchQuery$.complete();
    this.batchOperations$.complete();
    this.realtimeUpdates$.complete();
  }
}

// Singleton instance
export const reactiveDataService = new ReactiveDataService();
