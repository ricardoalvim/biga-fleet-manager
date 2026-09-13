import { useMemo, useCallback } from 'react'

export function usePermissions(permissions: readonly string[] = ['*']) {
  const isSuperAdmin = useMemo(() => permissions.includes('*'), [permissions])

  const hasPermission = useCallback(
    (required: string): boolean => {
      if (isSuperAdmin) return true
      if (permissions.includes(required)) return true

      const parts = required.split(':')
      if (parts.length >= 2) {
        const namespaceWildcard = `${parts[0]}:*`
        if (permissions.includes(namespaceWildcard)) return true
      }
      if (parts.length >= 3) {
        const subNamespaceWildcard = `${parts[0]}:${parts[1]}:*`
        if (permissions.includes(subNamespaceWildcard)) return true
      }

      return false
    },
    [permissions, isSuperAdmin],
  )

  const hasAny = useCallback(
    (requiredList: readonly string[]): boolean => {
      return requiredList.some((req) => hasPermission(req))
    },
    [hasPermission],
  )

  const hasAll = useCallback(
    (requiredList: readonly string[]): boolean => {
      return requiredList.every((req) => hasPermission(req))
    },
    [hasPermission],
  )

  return { hasPermission, hasAny, hasAll, isSuperAdmin }
}

