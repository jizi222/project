const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const { DateTime } = require('luxon');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json());

// Health check for deployment platforms
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Lendify is running' });
});

// Note: Static files are served after API routes to ensure API routes are checked first

// Initialize database with dummy data if it doesn't exist
async function initializeDatabase() {
  try {
    await fs.access(DB_PATH);
    // Database exists, read it
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Database doesn't exist, create with dummy data
    const dummyData = {
      users: [
        {
          id: 1,
          name: "Mike Johnson",
          email: "mike@example.com",
          password: "password123", // In production, use bcrypt
          location: { lat: 40.7128, lng: -74.0060 }, // NYC
          trustScore: 100
        },
        {
          id: 2,
          name: "Sarah Chen",
          email: "sarah@example.com",
          password: "password123",
          location: { lat: 40.7150, lng: -74.0080 },
          trustScore: 105
        },
        {
          id: 3,
          name: "Tom Rodriguez",
          email: "tom@example.com",
          password: "password123",
          location: { lat: 40.7100, lng: -74.0040 },
          trustScore: 95
        },
        {
          id: 4,
          name: "Lisa Park",
          email: "lisa@example.com",
          password: "password123",
          location: { lat: 40.7180, lng: -74.0100 },
          trustScore: 110
        }
      ],
      tools: [
        {
          id: 1,
          name: "Cordless Drill",
          category: "Power Tools",
          ownerID: 1,
          status: "Available",
          qrToken: "TOOL-001-DRILL",
          location: { lat: 40.7128, lng: -74.0060 }
        },
        {
          id: 2,
          name: "Circular Saw",
          category: "Power Tools",
          ownerID: 2,
          status: "Available",
          qrToken: "TOOL-002-SAW",
          location: { lat: 40.7150, lng: -74.0080 }
        },
        {
          id: 3,
          name: "Ladder (10ft)",
          category: "Ladders",
          ownerID: 3,
          status: "Available",
          qrToken: "TOOL-003-LADDER",
          location: { lat: 40.7100, lng: -74.0040 }
        },
        {
          id: 4,
          name: "Pressure Washer",
          category: "Outdoor",
          ownerID: 4,
          status: "Available",
          qrToken: "TOOL-004-WASHER",
          location: { lat: 40.7180, lng: -74.0100 }
        },
        {
          id: 5,
          name: "Angle Grinder",
          category: "Power Tools",
          ownerID: 1,
          status: "Available",
          qrToken: "TOOL-005-GRINDER",
          location: { lat: 40.7128, lng: -74.0060 }
        },
        {
          id: 6,
          name: "Toolbox Set",
          category: "Hand Tools",
          ownerID: 2,
          status: "Available",
          qrToken: "TOOL-006-BOX",
          location: { lat: 40.7150, lng: -74.0080 }
        }
      ],
      checkouts: [],
      ratings: []
    };
    await fs.writeFile(DB_PATH, JSON.stringify(dummyData, null, 2));
    return dummyData;
  }
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// API: Get tools within 5-mile radius
app.get('/api/get-tools', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const db = await initializeDatabase();
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Filter tools within 5-mile radius
    const nearbyTools = db.tools
      .filter(tool => {
        const distance = calculateDistance(userLat, userLng, tool.location.lat, tool.location.lng);
        return distance <= 5 && tool.status === 'Available';
      })
      .map(tool => {
        const owner = db.users.find(u => u.id === tool.ownerID);
        return {
          ...tool,
          ownerName: owner ? owner.name : 'Unknown',
          ownerTrustScore: owner ? owner.trustScore : 100,
          distance: calculateDistance(userLat, userLng, tool.location.lat, tool.location.lng)
        };
      });

    res.json({ tools: nearbyTools });
  } catch (error) {
    console.error('Error getting tools:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Checkout a tool (scan QR code)
app.post('/api/checkout', async (req, res) => {
  try {
    const { qrToken, borrowerID } = req.body;
    if (!qrToken || !borrowerID) {
      return res.status(400).json({ error: 'QR token and borrower ID are required' });
    }

    const db = await initializeDatabase();
    const tool = db.tools.find(t => t.qrToken === qrToken);

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    if (tool.status !== 'Available') {
      return res.status(400).json({ error: 'Tool is not available' });
    }

    // Update tool status
    tool.status = 'Rented';

    // Create checkout record with InsuranceTimer
    const checkout = {
      id: db.checkouts.length + 1,
      toolID: tool.id,
      toolName: tool.name,
      borrowerID: parseInt(borrowerID),
      lenderID: tool.ownerID,
      qrToken: qrToken,
      checkoutTime: DateTime.now().toISO(),
      status: 'Active'
    };

    db.checkouts.push(checkout);
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));

    res.json({
      success: true,
      checkout: checkout,
      message: 'Tool checked out successfully'
    });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Update trust score (return tool, rate, report damage)
app.post('/api/update-score', async (req, res) => {
  try {
    const { checkoutID, action, rating, borrowerID, lenderID } = req.body;
    // action can be: 'return_on_time', 'return_late', 'damage', 'rate'

    const db = await initializeDatabase();
    const checkout = db.checkouts.find(c => c.id === parseInt(checkoutID));

    if (!checkout) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    let scoreChange = 0;
    let borrower = db.users.find(u => u.id === parseInt(borrowerID));
    let lender = db.users.find(u => u.id === parseInt(lenderID));

    if (!borrower || !lender) {
      return res.status(404).json({ error: 'User not found' });
    }

    switch (action) {
      case 'return_on_time':
        scoreChange = 5;
        borrower.trustScore += 5;
        lender.trustScore += 5;
        checkout.status = 'Returned';
        break;
      case 'return_late':
        scoreChange = -20;
        borrower.trustScore = Math.max(0, borrower.trustScore - 20);
        lender.trustScore = Math.max(0, lender.trustScore - 20);
        checkout.status = 'Returned_Late';
        break;
      case 'damage':
        scoreChange = -20;
        borrower.trustScore = Math.max(0, borrower.trustScore - 20);
        lender.trustScore = Math.max(0, lender.trustScore - 20);
        checkout.status = 'Returned_Damaged';
        break;
      case 'rate':
        if (rating >= 4) {
          scoreChange = 2;
          borrower.trustScore += 2;
        } else if (rating <= 2) {
          scoreChange = -5;
          borrower.trustScore = Math.max(0, borrower.trustScore - 5);
        }
        // Store rating
        db.ratings.push({
          id: db.ratings.length + 1,
          checkoutID: parseInt(checkoutID),
          borrowerID: parseInt(borrowerID),
          lenderID: parseInt(lenderID),
          rating: rating,
          timestamp: DateTime.now().toISO()
        });
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // If returning, mark tool as available
    if (action.startsWith('return')) {
      const tool = db.tools.find(t => t.id === checkout.toolID);
      if (tool) {
        tool.status = 'Available';
      }
    }

    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));

    res.json({
      success: true,
      borrowerScore: borrower.trustScore,
      lenderScore: lender.trustScore,
      scoreChange: scoreChange,
      message: 'Trust score updated'
    });
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Get user's tools
app.get('/api/my-tools', async (req, res) => {
  try {
    const { userID } = req.query;
    if (!userID) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = await initializeDatabase();
    const userTools = db.tools.filter(t => t.ownerID === parseInt(userID));
    const checkouts = db.checkouts.filter(c => 
      userTools.some(t => t.id === c.toolID) || c.borrowerID === parseInt(userID)
    );

    res.json({ tools: userTools, checkouts: checkouts });
  } catch (error) {
    console.error('Error getting user tools:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Get user profile
app.get('/api/profile', async (req, res) => {
  try {
    const { userID } = req.query;
    if (!userID) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = await initializeDatabase();
    const user = db.users.find(u => u.id === parseInt(userID));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't send password
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Sign up (Register)
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password, lat, lng } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const db = await initializeDatabase();
    
    // Check if email already exists
    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const newUser = {
      id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
      name: name,
      email: email,
      password: password, // In production, hash with bcrypt
      location: { lat: lat || 40.7128, lng: lng || -74.0060 },
      trustScore: 100
    };

    db.users.push(newUser);
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));

    // Don't send password
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({
      success: true,
      user: userWithoutPassword,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API: Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await initializeDatabase();
    const user = db.users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Don't send password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files after API routes
app.use(express.static('public'));

// Fallback: serve index.html for any non-API routes (for SPA routing)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Lendify server running on port ${PORT}`);
});