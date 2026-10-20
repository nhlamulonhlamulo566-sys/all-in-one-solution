'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useUser } from '@/auth/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { KeyRound, Loader2, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { APP_ROLES, type AppRole } from '@/lib/roles';

type ManagedUser = {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
  createdAt?: string;
};

const roleLabels: Record<ManagedUser['role'], string> = {
  super_admin: 'Super administrator',
  staff: 'Staff',
  admin: 'Administrator',
};

function isManagedRole(role: string): role is AppRole {
  return APP_ROLES.some((managedRole) => managedRole === role);
}

export default function AdminUsersManager() {
  const { user: currentUser } = useUser();
  const isSuperAdministrator = currentUser?.role === 'super_admin';
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      const body = (await response.json()) as { users?: ManagedUser[]; error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to load user accounts.');
      setUsers(body.users ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load user accounts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setIsCreating(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.get('fullName'),
          email: data.get('email'),
          password: data.get('password'),
          role: data.get('role'),
        }),
      });
      const body = (await response.json()) as { user?: ManagedUser; error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to create this account.');
      form.reset();
      setNotice(`Account created for ${body.user?.email ?? 'the new user'}.`);
      await loadUsers();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create this account.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRoleChange(target: ManagedUser, role: ManagedUser['role']) {
    if (role === target.role) return;
    setUpdatingUserId(target.id);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/users/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || 'Unable to update this role.');
      setNotice(`${target.fullName}'s access is now ${roleLabels[role].toLowerCase()}.`);
      await loadUsers();
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : 'Unable to update this role.');
    } finally {
      setUpdatingUserId(null);
    }
  }

  const adminCount = users.filter(
    (account) => account.role === 'admin' || account.role === 'super_admin'
  ).length;
  const staffCount = users.filter((account) => account.role === 'staff').length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><Users className="h-5 w-5" /></div>
            <div><p className="text-sm text-muted-foreground">Total accounts</p><p className="text-2xl font-semibold">{users.length}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600"><ShieldCheck className="h-5 w-5" /></div>
            <div><p className="text-sm text-muted-foreground">Staff members</p><p className="text-2xl font-semibold">{staffCount}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600"><KeyRound className="h-5 w-5" /></div>
            <div><p className="text-sm text-muted-foreground">Administrators</p><p className="text-2xl font-semibold">{adminCount}</p></div>
          </CardContent>
        </Card>
      </div>

      {(error || notice) && (
        <div
          role={error ? 'alert' : 'status'}
          className={`rounded-lg border p-4 text-sm ${
            error
              ? 'border-destructive/50 bg-destructive/10 text-destructive'
              : 'border-border bg-muted text-foreground'
          }`}
        >
          {error ?? notice}
        </div>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Team directory</CardTitle>
            <CardDescription>Review accounts and grant the access each person needs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-full overflow-x-auto">
              <table className="w-full min-w-[38rem] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Account</th>
                    <th className="pb-3 pr-4 font-medium">Access</th>
                    <th className="pb-3 text-right font-medium">Change role</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">Loading accounts…</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">No accounts found.</td></tr>
                  ) : users.map((account) => (
                    <tr key={account.id} className="border-b last:border-0">
                      <td className="py-4 pr-4">
                        <p className="font-medium">{account.fullName}{account.id === currentUser?.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{account.email}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <Badge variant={account.role === 'staff' ? 'secondary' : 'default'}>{roleLabels[account.role]}</Badge>
                      </td>
                      <td className="py-4 text-right">
                        {account.id === currentUser?.id ? (
                          <span className="text-xs text-muted-foreground">Your access is protected</span>
                        ) : !isSuperAdministrator ? (
                          <span className="text-xs text-muted-foreground">Super administrator only</span>
                        ) : (
                          <select
                            aria-label={`Change access for ${account.fullName}`}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                            value={account.role}
                            disabled={updatingUserId === account.id}
                            onChange={(event) => {
                              const role = event.target.value;
                              if (isManagedRole(role)) void handleRoleChange(account, role);
                            }}
                          >
                            {APP_ROLES.map((role) => (
                              <option key={role} value={role}>{roleLabels[role]}</option>
                            ))}
                          </select>
                        )}
                        {updatingUserId === account.id && <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" />Create an account</CardTitle>
            <CardDescription>Set up a team member and choose their access level.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="fullName">Full name</label>
                <Input id="fullName" name="fullName" autoComplete="name" minLength={2} maxLength={160} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">Email address</label>
                <Input id="email" name="email" type="email" autoComplete="email" maxLength={254} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">Initial password</label>
                <Input id="password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
                <p className="text-xs text-muted-foreground">Use a unique password with at least 12 characters.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="role">Access level</label>
                <select id="role" name="role" defaultValue="staff" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {(isSuperAdministrator ? APP_ROLES : ['staff'] as const).map((role) => (
                    <option key={role} value={role}>{roleLabels[role]}</option>
                  ))}
                </select>
              </div>
              <Button className="w-full" type="submit" disabled={isCreating}>
                {isCreating ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account…</> : 'Create account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
