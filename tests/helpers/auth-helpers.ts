const BASE_URL = process.env.API_BASE_URL;

export async function getAuthToken(
  request: any,
  email: string = 'demo@qa.com',
  password: string = 'demo123'
) {
  const response = await request.post(`${BASE_URL}/auth/login`, {
    data: {
      email: email,
      password: password,
    },
  });

  const { token } = await response.json(); // destructuring

  return token;
}
