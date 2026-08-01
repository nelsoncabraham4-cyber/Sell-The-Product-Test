# Account Setup Guide for SellTheProduct

## Overview
This guide explains how to set up the Admin account and Team/Participant accounts for the SellTheProduct application.

## Prerequisites
- Firebase project configured with Authentication (Email/Password) enabled
- Firebase Realtime Database enabled
- `.env.local` file configured with Firebase credentials

## Step 1: Configure Admin Email

### Update Environment Variable
Add the following to your `.env.local` file:

```
NEXT_PUBLIC_ADMIN_EMAIL=admin@selltheproduct.com
```

Replace `admin@selltheproduct.com` with your desired admin email.

### Create Admin Account in Firebase Console
1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Enter the admin email (e.g., `admin@selltheproduct.com`)
4. Enter a secure password
5. Click "Add user"

### Set Admin Display Name (Optional)
The admin's display name can be set in Firebase Authentication or will default to null.

## Step 2: Create Team/Participant Accounts

### Method 1: Using Admin Dashboard (Recommended)
1. Log in as Admin
2. Go to "Players" tab
3. Click "Add Player" button
4. Fill in:
   - **Email**: Team email (e.g., `team01@selltheproduct.com`)
   - **Team Name**: Team name (e.g., "Team 01")
   - **Password**: Temporary password (e.g., `tempPassword123`)
5. Click "Create Player"
6. Inform the team member of their credentials and instruct them to reset their password

### Method 2: Using Firebase Console (Alternative)
1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Enter team email and password
4. Click "Add user"
5. Go to Firebase Console → Realtime Database
6. Navigate to `users/{uid}`
7. Add the following data:
   ```json
   {
     "name": "Team 01",
     "email": "team01@selltheproduct.com"
   }
   ```

## Step 3: Team Member Password Reset

After creating an account, team members should reset their password:

1. Team member logs in with temporary credentials
2. They will be redirected to the dashboard
3. To change password, they can use Firebase Auth password reset functionality
   - Or you can implement a password reset feature in the application

## Step 4: Verify Team Data Isolation

### Test Team 01 Access
1. Log in as Team 01
2. Verify they can only see:
   - Their own sales history
   - Their own leaderboard entry
   - Their own statistics
3. Verify they cannot see Team 02's data

### Test Admin Access
1. Log in as Admin
2. Verify they can see:
   - All teams' sales
   - All teams' statistics
   - All products
   - All player management options

## Example Account Setup

### Admin Account
- **Email**: admin@selltheproduct.com
- **Password**: [Your secure password]
- **Role**: Admin (automatically detected by email)

### Team Accounts
| Team | Email | Team Name | Password |
|------|-------|-----------|----------|
| Team 01 | team01@selltheproduct.com | Team 01 | tempPassword123 |
| Team 02 | team02@selltheproduct.com | Team 02 | tempPassword123 |
| Team 03 | team03@selltheproduct.com | Team 03 | tempPassword123 |

## Important Security Notes

1. **Password Security**: Always use strong passwords. The temporary password should be changed immediately by team members.

2. **Email Verification**: Consider enabling email verification in Firebase Authentication for additional security.

3. **Admin Email**: The admin email is configured via environment variable. Keep this secure.

4. **Data Isolation**: The current implementation uses client-side filtering. For production, implement Firebase Security Rules (see `FIREBASE_SECURITY_RULES.md`).

5. **Account Management**: Only admins can create/delete team accounts through the Admin Dashboard.

## Troubleshooting

### Admin Login Fails
- Verify `NEXT_PUBLIC_ADMIN_EMAIL` is set correctly in `.env.local`
- Restart the development server after changing environment variables
- Check Firebase Console Authentication to verify admin account exists

### Team Member Cannot Log In
- Verify the account was created in Firebase Authentication
- Verify the user record exists in Realtime Database under `users/{uid}`
- Check that the team name is set correctly in the database

### Team Sees Wrong Data
- Verify the team name is correctly set in the database
- Check that sales are being created with the correct `teamName`
- Verify the `userId` in sales matches the logged-in user's UID

## Next Steps

1. Apply Firebase Security Rules (see `FIREBASE_SECURITY_RULES.md`)
2. Test all account types
3. Verify data isolation
4. Deploy to production
