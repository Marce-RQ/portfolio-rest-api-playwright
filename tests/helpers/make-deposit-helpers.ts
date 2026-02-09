const BASE_URL = process.env.API_BASE_URL;

export async function makeDeposit(
  request: any,
  token: string,
  accountId: string,
  amount: number,
  reference?: string
) {
  const response = await request.post(`${BASE_URL}/deposits`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      accountId,
      amount,
      reference,
    },
  });

  const body = await response.json();
  return {
    response: response,
    body: body
  };
}
