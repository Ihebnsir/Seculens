export function getResetPasswordToken(pathname) {
  const match = pathname.match(/^\/reset-password\/([^/]+)\/?$/);
  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch (error) {
    return null;
  }
}

export function getEmailVerificationToken(pathname) {
  const match = pathname.match(/^\/verify-email\/([^/]+)\/?$/);
  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch (error) {
    return null;
  }
}