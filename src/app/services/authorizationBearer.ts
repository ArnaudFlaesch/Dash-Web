export default function authorizationBearer(): string {
  if (localStorage.getItem('user')) {
    const user = JSON.parse(localStorage.getItem('user') || '');
    if (user && user.accessToken) {
      return 'Bearer ' + user.accessToken;
    } else {
      return '';
    }
  } else {
    return '';
  }
}
