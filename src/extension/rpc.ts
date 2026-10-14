export async function rpc<T = any>(
  type: string,
  payload: unknown = {},
): Promise<T> {
  const response = await chrome.runtime.sendMessage({
    scope: "hv-helper",
    type,
    payload,
  });
  if (!response?.ok)
    throw new Error(response?.error || "扩展后台无响应，已停止自动操作");
  return response.value as T;
}
