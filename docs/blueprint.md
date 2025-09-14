# **App Name**: Sell The Product

## Core Features:

- Admin Authentication: Secure admin login using a predefined password (4321), followed by name and a unique password to verify and allow the admin to have their priviledges.
- User Authentication: Secure user login using team name and a password to grant users access to functionalities only meant for them.
- Product Table Generation (Admin): Admins can dynamically create a table with product names and actual prices, editable and viewable by all users.
- Sales Recording (User): Users can mark products as 'sold,' enter the selling price, and update the product table in a NextJS state that is saved to local storage, that is then used for calculating profit for generating a dynamic leaderboard
- Dynamic Leaderboard: Display a real-time leaderboard, updated in local storage with each 'sold' event and displayed in descending order by profit and time of sale.
- Data Persistence: Store and retrieve entered data (product details, sales, leaderboard) in local storage to maintain state across page refreshes and sessions.
- Clear History Function (Admin): Allow admins to permanently clear all data with a double confirmation to avoid accidental data loss.

## Style Guidelines:

- Primary color: Deep Indigo (#003057) to give off an intellectual and professional atmosphere, inspired by IEEE.
- Secondary color: IEEE Blue (#007DBA) for interactive elements and key highlights.
- Background color: Very light gray (#f0f0f0). Use a nearly-white background for readability and focus on content.
- Accent color: IEEE Gold (#F2C94C) for CTAs and important notifications, providing a touch of sophistication.
- Body font: 'Roboto', a sans-serif font that is easily readable.
- Headline font: 'Montserrat', a sans-serif font for clear headings and short informative pieces.
- Implement a responsive layout to ensure seamless usability across various devices, especially mobile.
- Add a gentle color change or a smooth transition to rows in the table when an item is marked as 'sold'.