import type { IResponse } from "@/type";
import httpCode from "@/utils/httpCode";

export function parsePermissionDeniedIds(data: unknown): number[] | null {
  if (typeof data !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.filter(
      (item): item is number => typeof item === "number" && Number.isFinite(item),
    );
  } catch {
    return null;
  }
}

export function getPermissionDeniedIdsFromResponse(
  response: Pick<IResponse<unknown>, "code" | "data">,
): number[] | null {
  if (response.code !== httpCode.noEditPermission) {
    return null;
  }

  return parsePermissionDeniedIds(response.data);
}

export function getPermissionDeniedIds(error: unknown): number[] | null {
  const maybeError = error as {
    response?: {
      data?: Pick<IResponse<unknown>, "code" | "data">;
    };
  };

  const responseData = maybeError?.response?.data;
  if (!responseData) {
    return null;
  }

  return getPermissionDeniedIdsFromResponse(responseData);
}

export { httpCode };
