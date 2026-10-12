type StorageRemovalError = {
  name: string;
  message: string;
  status?: number;
  statusCode?: string;
  code?: string;
};

export type StorageRemovalFailure = {
  reason:
    | 'missing_supabase_url'
    | 'missing_service_role_key'
    | 'storage_api_rejected'
    | 'storage_client_error';
  error: StorageRemovalError;
};

type StorageRemovalClient = {
  storage: {
    from(bucket: 'listings'): {
      remove(paths: string[]): Promise<{ error: unknown | null }>;
    };
  };
};

function getOptionalString(value: unknown) {
  return typeof value === 'string' && value ? value : undefined;
}

export function getStorageRemovalErrorDetails(error: unknown): StorageRemovalError {
  const properties = typeof error === 'object' && error !== null
    ? error as Record<string, unknown>
    : {};
  const message = error instanceof Error
    ? error.message
    : getOptionalString(properties.message) ?? 'Unknown Storage cleanup error.';
  const safeMessage = message
    .replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED]');
  const status = typeof properties.status === 'number' ? properties.status : undefined;
  const statusCode = getOptionalString(properties.statusCode);
  const code = getOptionalString(properties.code);

  return {
    name: getOptionalString(properties.name) ?? (error instanceof Error ? error.name : 'Error'),
    message: safeMessage,
    ...(status === undefined ? {} : { status }),
    ...(statusCode === undefined ? {} : { statusCode }),
    ...(code === undefined ? {} : { code }),
  };
}

function getFailure(error: unknown): StorageRemovalFailure {
  const details = getStorageRemovalErrorDetails(error);
  return {
    reason: details.status === undefined ? 'storage_client_error' : 'storage_api_rejected',
    error: details,
  };
}

export async function removeListingImages(
  client: StorageRemovalClient,
  paths: string[],
): Promise<{ failure: StorageRemovalFailure | null; pendingPaths: string[] }> {
  if (paths.length === 0) return { failure: null, pendingPaths: [] };

  try {
    const { error } = await client.storage.from('listings').remove(paths);
    return {
      failure: error ? getFailure(error) : null,
      pendingPaths: error ? paths : [],
    };
  } catch (error) {
    return {
      failure: getFailure(error),
      pendingPaths: paths,
    };
  }
}
