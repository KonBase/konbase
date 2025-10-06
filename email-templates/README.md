# KonBase Email Templates

This folder contains HTML email templates for Supabase Auth flows in the KonBase application. These templates are designed to match the application's UI and provide a consistent, professional user experience.

## 📧 Available Templates

### 1. **confirm-signup.html**
- **Purpose**: Email verification for new user signups
- **Variables**: `{{ .ConfirmationURL }}`, `{{ .Email }}`
- **Style**: Welcome-focused with feature highlights

### 2. **invite-user.html**
- **Purpose**: User invitations to join associations/conventions
- **Variables**: `{{ .InviteURL }}`, `{{ .InviterName }}`, `{{ .InviterRole }}`, `{{ .AssociationName }}`, `{{ .Role }}`, `{{ .ExpiresAt }}`, `{{ .Email }}`
- **Style**: Invitation-focused with role and association details

### 3. **magic-link.html**
- **Purpose**: Passwordless authentication via magic link
- **Variables**: `{{ .ConfirmationURL }}`, `{{ .LoginURL }}`, `{{ .Email }}`
- **Style**: Quick access with alternative login options

### 4. **change-email.html**
- **Purpose**: Email address change confirmation
- **Variables**: `{{ .ConfirmationURL }}`, `{{ .OldEmail }}`, `{{ .NewEmail }}`, `{{ .UserDisplayName }}`
- **Style**: Security-focused with email change details

### 5. **reset-password.html**
- **Purpose**: Password reset requests
- **Variables**: `{{ .ConfirmationURL }}`, `{{ .LoginURL }}`, `{{ .Email }}`
- **Style**: Security-focused with password tips

### 6. **reauthentication.html**
- **Purpose**: Re-authentication for sensitive actions
- **Variables**: `{{ .ConfirmationURL }}`, `{{ .ActionName }}`, `{{ .Email }}`, `{{ .UserDisplayName }}`, `{{ .RequestedAt }}`, `{{ .IPAddress }}`
- **Style**: Security-focused with verification details

## 🎨 Design System

### Colors
- **Primary Blue**: `#0c2e62` - Main brand color
- **Secondary Cyan**: `#0fb4ea` - Accent color
- **Accent Cherry**: `#d84165` - Call-to-action color
- **Konbase Yellow**: `#fce771` - Highlight color
- **Background**: `#f8fafc` - Light background
- **Text**: `#4a5568` - Body text
- **Muted**: `#718096` - Secondary text

### Typography
- **Font Family**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
- **Headings**: Bold, 28px for main titles
- **Body Text**: 16px with 1.6 line height
- **Small Text**: 14px for secondary information

### Layout
- **Container**: 600px max width, centered
- **Border Radius**: 12px for modern look
- **Shadows**: Subtle drop shadows for depth
- **Spacing**: Consistent padding and margins

## 🚀 Usage with Supabase

These templates are designed to work with Supabase Auth email templates. To use them:

1. **Upload to Supabase Dashboard**:
   - Go to Authentication > Email Templates in your Supabase dashboard
   - Replace the default templates with these custom ones

2. **Template Variables**:
   - Supabase automatically provides standard variables like `{{ .ConfirmationURL }}`
   - Custom variables should be configured in your Supabase Auth settings

3. **Customization**:
   - Update colors in the CSS to match your brand
   - Modify content to match your application's tone
   - Add your logo or branding elements

## 📱 Responsive Design

All templates include responsive CSS that adapts to mobile devices:
- Reduced padding on smaller screens
- Stacked layouts for better mobile viewing
- Touch-friendly button sizes
- Readable font sizes across devices

## 🔧 Customization

### Brand Colors
Update the CSS variables in each template to match your brand:
```css
/* Primary brand color */
background: linear-gradient(135deg, #0c2e62 0%, #0fb4ea 100%);

/* Accent colors */
background: linear-gradient(135deg, #d84165 0%, #fce771 100%);
```

### Content
- Replace "KonBase" with your application name
- Update feature lists to match your application's capabilities
- Modify security notes to match your policies

### Images
- Add your logo to the header section
- Include relevant icons or graphics
- Ensure images are optimized for email clients

## 🛡️ Security Considerations

- All templates include security notes appropriate to their purpose
- Links expire within reasonable timeframes (1-24 hours)
- Clear instructions for users who didn't request the action
- Contact information for support

## 📧 Email Client Compatibility

These templates are tested and compatible with:
- Gmail (web and mobile)
- Outlook (2016+)
- Apple Mail
- Thunderbird
- Mobile email clients

## 🎯 Best Practices

1. **Keep it Simple**: Focus on the main action required
2. **Clear CTAs**: Prominent, well-labeled buttons
3. **Mobile First**: Design for mobile, enhance for desktop
4. **Consistent Branding**: Match your application's visual identity
5. **Security Focus**: Clear security information and warnings
6. **Accessibility**: Good contrast ratios and readable fonts

## 📝 Template Variables Reference

| Variable | Description | Available In |
|----------|-------------|--------------|
| `{{ .ConfirmationURL }}` | The action URL | All templates |
| `{{ .Email }}` | User's email address | All templates |
| `{{ .UserDisplayName }}` | User's display name | change-email, reauthentication |
| `{{ .InviteURL }}` | Invitation acceptance URL | invite-user |
| `{{ .InviterName }}` | Name of person sending invitation | invite-user |
| `{{ .AssociationName }}` | Association being invited to | invite-user |
| `{{ .Role }}` | Role being assigned | invite-user |
| `{{ .OldEmail }}` | Previous email address | change-email |
| `{{ .NewEmail }}` | New email address | change-email |
| `{{ .ActionName }}` | Sensitive action being performed | reauthentication |
| `{{ .RequestedAt }}` | Timestamp of request | reauthentication |
| `{{ .IPAddress }}` | IP address of request | reauthentication |

## 🔄 Updates

When updating templates:
1. Test in multiple email clients
2. Verify all links work correctly
3. Check responsive behavior on mobile
4. Update this README if adding new variables or features

---

*These templates are designed specifically for KonBase but can be adapted for other applications by updating the branding, colors, and content.*
