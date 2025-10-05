# System Routingu Opartego na Rolach

## Przegląd

Nowy system routingu automatycznie przekierowuje użytkowników do odpowiednich paneli w zależności od ich roli po zalogowaniu.

## Struktura Komponentów

### 1. `AppRouter` - Główny Router
- Centralny komponent routingu aplikacji
- Definiuje wszystkie trasy publiczne i chronione
- Używa `ProtectedRoute` do kontroli dostępu

### 2. `RoleBasedRedirect` - Inteligentne Przekierowanie
- Automatycznie przekierowuje użytkowników na podstawie roli
- Używany jako główna trasa (`/`) aplikacji

### 3. `ProtectedRoute` - Ochrona Tras
- Sprawdza autoryzację i uprawnienia użytkownika
- Przekierowuje nieautoryzowanych użytkowników
- Obsługuje role-based access control

### 4. `PublicRoute` - Trasy Publiczne
- Dla tras dostępnych bez logowania
- Przekierowuje zalogowanych użytkowników

## Mapowanie Ról na Trasy

| Rola | Przekierowanie | Opis |
|------|----------------|------|
| `super_admin` | `/admin` | Pełny dostęp administracyjny |
| `system_admin` | `/admin` | Dostęp administracyjny |
| `admin` | `/admin` | Panel administracyjny |
| `manager` | `/dashboard` | Dashboard z uprawnieniami zarządzania |
| `member` | `/dashboard` | Dashboard z podstawowymi uprawnieniami |
| `guest` | `/profile` | Ograniczony dostęp - tylko profil |

## Uprawnienia do Tras

### Trasy Administracyjne (`admin/*`)
- **Wymagane role:** `admin`, `system_admin`, `super_admin`
- **Dostęp:** Panel administracyjny, zarządzanie systemem

### Dashboard (`/dashboard`)
- **Wymagane role:** `manager`, `admin`, `system_admin`, `super_admin`
- **Dostęp:** Przegląd systemu, podstawowe funkcje

### Zarządzanie Stowarzyszeniami (`association/*`)
- **Wymagane role:** `manager`, `admin`, `system_admin`, `super_admin`
- **Dostęp:** Zarządzanie stowarzyszeniami i członkami

### Konwencje (`conventions/*`)
- **Wymagane role:** `member`, `manager`, `admin`, `system_admin`, `super_admin`
- **Dostęp:** Przegląd i zarządzanie konwencjami

### Inwentarz (`inventory/*`)
- **Wymagane role:** `member`, `manager`, `admin`, `system_admin`, `super_admin`
- **Dostęp:** Zarządzanie sprzętem i inwentarzem

### Raporty (`reports/*`)
- **Wymagane role:** `manager`, `admin`, `system_admin`, `super_admin`
- **Dostęp:** Generowanie i przeglądanie raportów

### Profil (`/profile`)
- **Wymagane role:** Wszystkie role
- **Dostęp:** Zarządzanie własnym profilem

## Użycie w Komponentach

### Hook `useRoleBasedAccess`
```tsx
import { useRoleBasedAccess } from '@/components/routing';

const MyComponent = () => {
  const { canAccessAdmin, canAccessDashboard, userRole } = useRoleBasedAccess();
  
  if (canAccessAdmin()) {
    return <AdminPanel />;
  }
  
  if (canAccessDashboard()) {
    return <Dashboard />;
  }
  
  return <Profile />;
};
```

### Funkcja `getRedirectPathForRole`
```tsx
import { getRedirectPathForRole } from '@/components/routing';

const redirectPath = getRedirectPathForRole('admin'); // Zwraca '/admin'
```

## Debugowanie

W trybie deweloperskim możesz użyć komponentu `RoutingDebugInfo` do wyświetlenia informacji o routingu:

```tsx
import { RoutingDebugInfo } from '@/components/routing';

// Dodaj do głównego layoutu
<RoutingDebugInfo />
```

## Przykład Użycia

```tsx
// W głównym komponencie App.tsx
import { AppRouter } from '@/components/routing';

function App() {
  return (
    <AuthProvider>
      <AssociationProvider>
        <AppRouter />
      </AssociationProvider>
    </AuthProvider>
  );
}
```

## Bezpieczeństwo

- Wszystkie trasy są chronione przez `ProtectedRoute`
- Sprawdzanie ról odbywa się zarówno po stronie klienta jak i serwera
- Automatyczne przekierowania zapobiegają nieautoryzowanemu dostępowi
- Sesje są monitorowane i przywracane automatycznie
