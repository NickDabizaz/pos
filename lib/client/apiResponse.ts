export type ApiResponse<T> = {
  data   ?: T;
  message : string;
};

export async function parseResponse<T>(response: Response): Promise<T> {
  const json: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new Error(json.message);
  }

  return json.data as T;
}
