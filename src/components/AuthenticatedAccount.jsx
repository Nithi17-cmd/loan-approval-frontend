import { readAuthSession } from '../utils/auth';

function AuthenticatedAccount() {
  const session = readAuthSession();

  if (!session?.role && !session?.username) {
    return null;
  }

  return (
    <div className="authenticated-account" aria-label="Signed-in account">
      {session.username && <span>{session.username}</span>}
      {session.role && <span className="authenticated-role">{session.role}</span>}
    </div>
  );
}

export default AuthenticatedAccount;
