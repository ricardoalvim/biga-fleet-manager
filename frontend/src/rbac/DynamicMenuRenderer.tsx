import React from 'react'
import type { PortalMenuTree, MenuItem } from '../types/portal.types.js'

interface DynamicMenuRendererProps {
  readonly menuTree: PortalMenuTree
  readonly currentPath: string
  readonly onNavigate: (path: string) => void
  readonly onSwitchRole?: (roleId: string) => void
  readonly availableRoles?: ReadonlyArray<{ id: string; name: string }>
}

export const DynamicMenuRenderer: React.FC<DynamicMenuRendererProps> = ({
  menuTree,
  currentPath,
  onNavigate,
  onSwitchRole,
  availableRoles,
}) => {
  const { branding, items, roleName } = menuTree

  return (
    <aside
      className="w-64 min-h-screen flex flex-col border-r text-gray-800 bg-white"
      style={{
        borderRightColor: '#E5E7EB',
      }}
    >
      {/* Header com Branding White-Label */}
      <div
        className="p-4 border-b flex items-center gap-3"
        style={{
          borderBottomColor: '#E5E7EB',
          backgroundColor: branding.primaryColor,
          color: '#FFFFFF',
        }}
      >
        {branding.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={branding.displayName}
            className="h-8 w-8 object-contain rounded"
          />
        ) : (
          <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center font-bold text-sm">
            BF
          </div>
        )}
        <div className="overflow-hidden">
          <h1 className="font-bold text-sm truncate">{branding.displayName}</h1>
          <span className="text-xs opacity-80 block truncate">{roleName}</span>
        </div>
      </div>

      {/* Role Switcher se disponível */}
      {availableRoles && availableRoles.length > 0 && onSwitchRole && (
        <div className="p-3 border-b bg-gray-50 text-xs">
          <label className="block text-gray-500 mb-1 font-medium">Perfil Ativo</label>
          <select
            className="w-full p-1.5 border rounded bg-white text-gray-700 text-xs focus:ring-1"
            value={menuTree.roleId ?? ''}
            onChange={(e) => onSwitchRole(e.target.value)}
          >
            <option value="">Admin Padrão (*)</option>
            {availableRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navegação Dinâmica Baseada em RBAC */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item: MenuItem) => {
          const isActive = currentPath === item.path
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'text-white font-semibold shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: isActive ? branding.primaryColor : undefined,
              }}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="opacity-75">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold"
                  style={{
                    backgroundColor: isActive
                      ? 'rgba(255,255,255,0.2)'
                      : branding.secondaryColor,
                    color: isActive ? '#FFFFFF' : '#FFFFFF',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer com Indicador de Conexão */}
      <div className="p-3 border-t text-[11px] text-gray-500 flex items-center justify-between bg-gray-50">
        <span>Biga Fleet Engine</span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500 inline-block animate-pulse" />
          <span>Online</span>
        </span>
      </div>
    </aside>
  )
}

