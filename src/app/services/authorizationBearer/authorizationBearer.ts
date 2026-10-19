export default function authorizationBearer(): string {
  const user = JSON.parse(localStorage.getItem("user") ?? "{}");
  return user.accessToken ? `Bearer ${user.accessToken}` : "";
}
