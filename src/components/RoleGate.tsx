import type { ReactNode } from 'react';
import type { Role, Member } from '../types';

interface RoleGateProps {
  currentMember: Member | null;
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGate({ currentMember, allowedRoles, children, fallback }: RoleGateProps) {
  if (!currentMember) return fallback ? <>{fallback}</> : null;
  if (!allowedRoles.includes(currentMember.role)) return fallback ? <>{fallback}</> : null;
  return <>{children}</>;
}
