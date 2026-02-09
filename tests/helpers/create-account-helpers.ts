const BASE_URL = process.env.API_BASE_URL;

export async function createAccount(request: any, token: string, currency = 'EUR') {
  const response = await request.post(`${BASE_URL}/accounts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      currency,
    },
  });
  const body = await response.json();
  return {
    response: response,
    body: body
  };
}
