'use client'
import { ReactNode, useState, useEffect } from 'react'
import { AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemText, Box, Container, Menu, MenuItem, Avatar, Divider, TextField, InputAdornment, Autocomplete } from '@mui/material'
// Replace icons with simple text to avoid extra dependency for now
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
// useEffect/useState already imported
import { useAppStore } from '@/lib/utils/store'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { ChatWidget } from '@/components/chat/ChatWidget'

export default function AppLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { data: session } = useSession()
  const router = useRouter()

  const menuItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Inventory', href: '/inventory' },
    { label: 'Equipment Sets', href: '/inventory/equipment-sets' },
    { label: 'Conventions', href: '/conventions' },
    { label: 'Reports', href: '/reports' },
    { label: 'Associations', href: '/associations' },
    { label: 'Admin Panel', href: '/admin', adminOnly: true },
  ]

  const assoc = useAppStore(s => s.currentAssociation)
  const setAssoc = useAppStore(s => s.setAssociation)
  const [associations, setAssociations] = useState<Array<{ id: string; name: string }>>([])
  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/associations')
      if (res.ok) {
        const j = await res.json()
        const list = (j.data || []).map((m: any) => ({ id: m.association.id, name: m.association.name }))
        setAssociations(list)
        if (!assoc && list[0]) setAssoc(list[0])
      }
    })()
  }, [])

  return (
    <Box>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton color="inherit" onClick={() => setOpen(true)}>☰</IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>KonBase</Typography>
          <Autocomplete
            size="small"
            sx={{ minWidth: 220, mr: 2 }}
            options={associations}
            value={assoc || null}
            getOptionLabel={(o) => o?.name || ''}
            onChange={(_, v) => setAssoc(v || undefined)}
            renderInput={(params) => <TextField {...params} label="Association" />}
          />

          <TextField
            size="small"
            placeholder="Search..."
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 1, mr: 2, minWidth: 240 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">🔎</InputAdornment>
              ),
            }}
            onChange={(e) => useAppStore.getState().setSearch(e.target.value)}
          />
          <Typography sx={{ mr: 2 }}>{(session as any)?.user?.profile?.display_name ?? (session as any)?.user?.email}</Typography>
          
          {/* Notification Center */}
          <NotificationCenter />
          
          {/* Chat Widget */}
          <ChatWidget />
          
          <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar src={(session as any)?.user?.profile?.avatar_url || undefined} />
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => router.push('/users/profile')}>Profile</MenuItem>
            <MenuItem onClick={() => router.push('/associations')}>Switch Association</MenuItem>
            <Divider />
            <MenuItem onClick={() => signOut({ callbackUrl: '/auth/signin' })}>Sign out</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 260 }} role="presentation" onClick={() => setOpen(false)}>
          <List>
            {menuItems.map((item) => {
              // Check if item is admin-only and user is not super admin
              if (item.adminOnly && (session as any)?.user?.role !== 'super_admin') {
                return null
              }
              return (
                <ListItem key={item.href} onClick={() => router.push(item.href)} component="li" sx={{ cursor: 'pointer' }}>
                  <ListItemText primary={item.label} />
                </ListItem>
              )
            })}
          </List>
        </Box>
      </Drawer>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {children}
        <Box component="footer" sx={{ mt: 6, py: 2, color: 'text.secondary', textAlign: 'center' }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2">© {new Date().getFullYear()} KonBase</Typography>
        </Box>
      </Container>
    </Box>
  )
}
