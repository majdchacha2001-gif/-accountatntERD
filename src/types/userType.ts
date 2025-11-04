export type UserData = {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  refreshToken: string;
};
export type LoginData = {
  username: string;
  password: string;
};
export type RefreshTokenData = {
  refreshToken: string;
};

