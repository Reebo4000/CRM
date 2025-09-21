import { useState, useEffect, useCallback, useRef } from 'react';
import { handleApiError, api } from '../services/api';

// Custom hook for API calls with loading, error, and data state management
export const useApi = (apiFunction, dependencies = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    immediate = true,
    onSuccess,
    onError,
    transform,
  } = options;

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFunction(...args);
      let result = response.data;

      // Transform data if transform function is provided
      if (transform && typeof transform === 'function') {
        result = transform(result);
      }

      setData(result);

      // Call success callback if provided
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(result);
      }

      return { success: true, data: result };
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo);

      // Call error callback if provided
      if (onError && typeof onError === 'function') {
        onError(errorInfo);
      }

      return { success: false, error: errorInfo };
    } finally {
      setLoading(false);
    }
  }, [apiFunction, transform, onSuccess, onError]);

  // Execute immediately if immediate is true
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    refetch,
    reset,
  };
};

// Hook for paginated API calls
export const usePaginatedApi = (apiFunction, initialParams = {}, options = {}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState({ page: 1, limit: 10, ...initialParams });

  // Use ref to store current params to avoid infinite loops
  const paramsRef = useRef({ page: 1, limit: 10, ...initialParams });

  const {
    immediate = true,
    onSuccess,
    onError,
    transform,
  } = options;

  const execute = useCallback(async (newParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      const requestParams = { ...paramsRef.current, ...newParams };
      const response = await apiFunction(requestParams);

      let result = response.data;

      // Transform data if transform function is provided
      if (transform && typeof transform === 'function') {
        result = transform(result);
      }

      // Extract data and pagination info
      const items = result.data || result.items || result.orders || result.customers || result.products || result.users || result;
      const paginationInfo = result.pagination || {};

      // Ensure items is always an array
      const safeItems = Array.isArray(items) ? items : [];
      setData(safeItems);
      setPagination({
        currentPage: paginationInfo.currentPage || requestParams.page || 1,
        totalPages: paginationInfo.totalPages || 1,
        totalItems: paginationInfo.totalItems || paginationInfo.total || paginationInfo.totalOrders || paginationInfo.totalCustomers || paginationInfo.totalProducts || paginationInfo.totalUsers || safeItems.length,
        hasNext: paginationInfo.hasNext || false,
        hasPrev: paginationInfo.hasPrev || false,
      });

      // Update params ref and state
      paramsRef.current = requestParams;
      setParams(requestParams);

      // Call success callback if provided
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(result);
      }

      return { success: true, data: items, pagination: paginationInfo };
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo);

      // Call error callback if provided
      if (onError && typeof onError === 'function') {
        onError(errorInfo);
      }

      return { success: false, error: errorInfo };
    } finally {
      setLoading(false);
    }
  }, [apiFunction, transform, onSuccess, onError]);

  // Execute immediately if immediate is true
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []);

  const goToPage = useCallback((page) => {
    return execute({ page });
  }, [execute]);

  const nextPage = useCallback(() => {
    if (pagination.hasNext) {
      return execute({ page: pagination.currentPage + 1 });
    }
  }, [execute, pagination.hasNext, pagination.currentPage]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrev) {
      return execute({ page: pagination.currentPage - 1 });
    }
  }, [execute, pagination.hasPrev, pagination.currentPage]);

  const updateParams = useCallback((newParams) => {
    return execute({ ...newParams, page: 1 }); // Reset to first page when params change
  }, [execute]);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  const reset = useCallback(() => {
    const resetParams = { page: 1, limit: 10, ...initialParams };
    setData([]);
    setPagination({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      hasNext: false,
      hasPrev: false,
    });
    setError(null);
    setLoading(false);
    setParams(resetParams);
    paramsRef.current = resetParams;
  }, [initialParams]);

  return {
    data,
    pagination,
    loading,
    error,
    params,
    execute,
    goToPage,
    nextPage,
    prevPage,
    updateParams,
    refetch,
    reset,
  };
};

// Hook for form submissions
export const useApiSubmit = (apiFunction, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const {
    onSuccess,
    onError,
    resetOnSuccess = true,
  } = options;

  const submit = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      console.log('📤 useApiSubmit - Submitting data:', data);
      const response = await apiFunction(data);
      const result = response.data;

      console.log('✅ useApiSubmit - Submission successful:', result);
      setSuccess(true);

      // Call success callback if provided
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(result);
      }

      // Reset success state after a delay if resetOnSuccess is true
      if (resetOnSuccess) {
        setTimeout(() => setSuccess(false), 3000);
      }

      return { success: true, data: result };
    } catch (err) {
      console.error('❌ useApiSubmit - Submission failed:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });

      const errorInfo = handleApiError(err);
      setError(errorInfo);

      // Call error callback if provided
      if (onError && typeof onError === 'function') {
        onError(errorInfo);
      }

      return { success: false, error: errorInfo };
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError, resetOnSuccess]);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
    setLoading(false);
  }, []);

  return {
    submit,
    loading,
    error,
    success,
    reset,
  };
};

// Hook for fetching notification preferences (for dynamic thresholds)
export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const response = await api.get('/notifications/preferences', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        const data = response.data;
        setPreferences(data.preferences || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch notification preferences:', err);
        setError(err.message);
        setPreferences([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Helper function to get threshold for a specific notification type
  const getThreshold = (notificationType, thresholdKey = 'quantity') => {
    if (!preferences) return null;

    const pref = preferences.find(p => p.notificationType === notificationType);
    return pref?.threshold?.[thresholdKey] || null;
  };

  // Get stock level thresholds
  const getStockThresholds = () => {
    return {
      low: getThreshold('stock_low') || 5,      // Default to 5
      medium: getThreshold('stock_medium') || 10 // Default to 10
    };
  };

  return {
    preferences,
    loading,
    error,
    getThreshold,
    getStockThresholds
  };
};

export default useApi;
