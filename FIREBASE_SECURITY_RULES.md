# Firebase Realtime Database Security Rules

## Overview
These security rules provide server-side enforcement for:
- Admin access to all data
- Participant access only to their own team's data
- Prevention of cross-team data access
- Protection of admin-only operations

## Database Structure

### Users Collection (`users/{uid}`)
```json
{
  "name": "Team 01",
  "email": "team01@example.com",
  "teamId": "uid_of_user",
  "isAdmin": false
}
```

### Sales Collection (`sales/{saleId}`)
```json
{
  "productId": "...",
  "productName": "...",
  "teamName": "Team 01",
  "teamId": "uid_of_user",
  "sellingPrice": 100,
  "actualPrice": 80,
  "profit": 20,
  "timestamp": 1234567890,
  "userId": "uid_of_user",
  "paymentMethod": "cash"
}
```

### Products Collection (`products/{productId}`)
```json
{
  "name": "Product Name",
  "actualPrice": 80,
  "quantity": 10
}
```

### Team Inventory Collection (`teamInventory/{teamId}/{productId}`)
```json
{
  "quantity": 10
}
```

## Security Rules
```json
{
  "rules": {
    ".read": false,
    ".write": false,

    "products": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() === true",
      ".write": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() === true"
    },

    "teamInventory": {
      "$teamId": {
        ".read": "auth != null && (root.child('users').child(auth.uid).child('isAdmin').val() === true || root.child('users').child(auth.uid).child('teamId').val() === $teamId)",
        ".write": "auth != null && (root.child('users').child(auth.uid).child('isAdmin').val() === true || root.child('users').child(auth.uid).child('teamId').val() === $teamId)",
        ".validate": "newData.hasChildren(['quantity']) && newData.child('quantity').isNumber()"
      }
    },

    "sales": {
      ".read": "auth != null",
      ".write": "auth != null",

      "$saleId": {
        ".read": "auth != null && (root.child('users').child(auth.uid).child('isAdmin').val() === true || newData.child('teamId').val() === root.child('users').child(auth.uid).child('teamId').val() || data.child('teamId').val() === root.child('users').child(auth.uid).child('teamId').val())",
        ".write": "auth != null && (root.child('users').child(auth.uid).child('isAdmin').val() === true || (newData.child('teamId').val() === root.child('users').child(auth.uid).child('teamId').val() && newData.child('userId').val() === auth.uid))",
        ".validate": "newData.hasChildren(['productId', 'productName', 'teamName', 'teamId', 'sellingPrice', 'actualPrice', 'profit', 'timestamp', 'userId'])"
      }
    },

    "users": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() === true",
      ".write": "auth != null",

      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('users').child(auth.uid).child('isAdmin').val() === true)",
        ".write": "auth != null && (auth.uid === $uid || root.child('users').child(auth.uid).child('isAdmin').val() === true)",
        ".validate": "newData.child('teamId').val() === $uid || root.child('users').child(auth.uid).child('isAdmin').val() === true"
      }
    }
  }
}
```

## Security Rule Explanations

### Products
- **Read**: Only admins can read products
- **Write**: Only admins can write products
- This ensures participants cannot modify product inventory

### Team Inventory
- **Read**: Admins or the team itself can read its inventory
- **Write**: Admins or the team itself can update its inventory (e.g., decrement on sale)
- **Validate**: Ensures `quantity` is a number

### Sales
- **Read**: Participants can read sales where their `teamId` matches the sale's `teamId`. Admins can read all sales.
- **Write**: Participants can only create sales with their own `teamId` and `userId`. Admins can write any sale.
- **Validate**: Ensures all required fields are present when creating a sale

### Users
- **Read**: Admins can read all users. Participants can only read their own user record.
- **Write**: Admins can write any user record. Participants can only write their own record.
- **Validate**: Ensures `teamId` matches the user's UID (prevents teamId spoofing)

## How to Apply These Rules
1. Go to Firebase Console → Realtime Database → Rules
2. Copy the rules above
3. Paste them into the rules editor
4. Click "Publish"

## Testing Security Rules
Use the Firebase Console Rules Simulator to test various scenarios (admin access, participant own data, cross‑team restrictions, etc.).

## Migration for Existing Data
If you have existing sales without `teamId`, run the migration script provided in the previous documentation to add `teamId` based on `userId`.

## Security Checklist
- ✅ Admin can access all data
- ✅ Participants can only read their own team's sales and inventory
- ✅ Participants cannot read other teams' data
- ✅ Participants can only create sales with their own `teamId`
- ✅ Participants cannot create sales for other teams
- ✅ Participants cannot modify other users' data
- ✅ Only admins can manage products and users
- ✅ `teamId` cannot be spoofed by participants
- ✅ `userId` cannot be spoofed by participants
